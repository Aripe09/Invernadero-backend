const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

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

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'invernadero.db'
});

db.connect((err) => {
    if (err) console.error('Error conectando a BD:', err);
    else console.log('Conectado a MySQL');
});

module.exports = db;
