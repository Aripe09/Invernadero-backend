const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
let Pool;

try {
    ({ Pool } = require('pg'));
} catch (err) {
    Pool = null;
}

const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');

    envFile.split(/\r?\n/).forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('#')) return;

        const separatorIndex = cleanLine.indexOf('=');
        if (separatorIndex === -1) return;

        const key = cleanLine.slice(0, separatorIndex).trim();
        const value = cleanLine.slice(separatorIndex + 1).trim();

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    });
}

const dbClient = (process.env.DB_CLIENT || process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'mysql')).toLowerCase();
const isPostgres = dbClient === 'postgres' || dbClient === 'postgresql';
const syncDbClient = (process.env.SYNC_DB_CLIENT || process.env.SYNC_DB_DIALECT || (process.env.SYNC_DATABASE_URL ? 'postgres' : '')).toLowerCase();
const hasSyncDatabase = Boolean(syncDbClient || process.env.SYNC_DB_HOST || process.env.SYNC_DATABASE_URL);
const isSyncPostgres = syncDbClient === 'postgres' || syncDbClient === 'postgresql';

const translatePlaceholders = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
};

const normalizePgResult = (result) => {
    const rows = result.rows || [];
    rows.insertId = rows[0]?.id_producto || rows[0]?.id || null;
    rows.affectedRows = result.rowCount || 0;
    return rows;
};

let client;
let syncClient = null;

if (isPostgres) {
    if (!Pool) {
        throw new Error('Falta instalar la dependencia pg para usar PostgreSQL.');
    }

    client = new Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    });

    client.connect()
        .then((connection) => {
            connection.release();
            console.log('Conectado a PostgreSQL');
        })
        .catch((err) => console.error('Error conectando a PostgreSQL:', err));
} else {
    client = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'invernadero.db',
        multipleStatements: true
    });

    client.connect((err) => {
        if (err) console.error('Error conectando a MySQL:', err);
        else console.log('Conectado a MySQL');
    });
}

if (hasSyncDatabase) {
    if (isSyncPostgres) {
        if (!Pool) {
            throw new Error('Falta instalar la dependencia pg para sincronizar con PostgreSQL.');
        }

        syncClient = new Pool({
            connectionString: process.env.SYNC_DATABASE_URL,
            host: process.env.SYNC_DB_HOST,
            port: process.env.SYNC_DB_PORT ? Number(process.env.SYNC_DB_PORT) : undefined,
            user: process.env.SYNC_DB_USER,
            password: process.env.SYNC_DB_PASSWORD,
            database: process.env.SYNC_DB_NAME,
            ssl: process.env.SYNC_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });

        syncClient.connect()
            .then((connection) => {
                connection.release();
                console.log('Sincronizacion conectada a PostgreSQL');
            })
            .catch((err) => console.error('Error conectando sincronizacion PostgreSQL:', err));
    } else {
        syncClient = mysql.createConnection({
            host: process.env.SYNC_DB_HOST || 'localhost',
            port: process.env.SYNC_DB_PORT ? Number(process.env.SYNC_DB_PORT) : undefined,
            user: process.env.SYNC_DB_USER || 'root',
            password: process.env.SYNC_DB_PASSWORD || '',
            database: process.env.SYNC_DB_NAME,
            multipleStatements: true
        });

        syncClient.connect((err) => {
            if (err) console.error('Error conectando sincronizacion MySQL:', err);
            else console.log('Sincronizacion conectada a MySQL');
        });
    }
}

const query = (sql, params = [], callback) => {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }

    if (!isPostgres) {
        return client.query(sql, params, callback);
    }

    const finalSql = translatePlaceholders(sql);
    const promise = client.query(finalSql, params)
        .then(normalizePgResult);

    if (callback) {
        promise
            .then((rows) => callback(null, rows))
            .catch((err) => {
                err.sqlMessage = err.message;
                callback(err);
            });
        return undefined;
    }

    return promise;
};

const promiseQuery = (sql, params = []) => {
    if (!isPostgres) {
        return new Promise((resolve, reject) => {
            client.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    return query(sql, params);
};

const queryOn = (targetClient, targetIsPostgres, sql, params = []) => {
    if (!targetClient) return Promise.resolve([]);

    if (targetIsPostgres) {
        return targetClient.query(translatePlaceholders(sql), params)
            .then(normalizePgResult);
    }

    return new Promise((resolve, reject) => {
        targetClient.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const syncPromiseQuery = (sql, params = []) => {
    if (!syncClient) return Promise.resolve({ skipped: true });
    return queryOn(syncClient, isSyncPostgres, sql, params);
};

module.exports = {
    query,
    promiseQuery,
    syncPromiseQuery,
    isPostgres,
    hasSyncDatabase,
    isSyncPostgres,
    client,
    syncClient,
    bool: (value) => (isPostgres ? Boolean(value) : (value ? 1 : 0))
};
