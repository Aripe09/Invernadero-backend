const express = require('express');
const router = express.Router();
const {
    getInfoRespaldos,
    descargarRespaldo
} = require('../controllers/respaldoController');

router.get('/respaldos/info', getInfoRespaldos);
router.get('/respaldos/:tipo', descargarRespaldo);

module.exports = router;
