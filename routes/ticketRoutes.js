const express = require('express');
const router = express.Router();
const { enviarTicketCorreo } = require('../controllers/ticketController');

router.post('/tickets/enviar-correo', enviarTicketCorreo);

module.exports = router;
