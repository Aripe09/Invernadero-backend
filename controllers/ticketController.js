const nodemailer = require('nodemailer');

const smtpConfigCompleta = () => (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
);

const crearTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const enviarTicketCorreo = async (req, res) => {
    const { correo, folio, ticketHtml, ticketPdfBase64 } = req.body;

    if (!correo || !folio || (!ticketHtml && !ticketPdfBase64)) {
        return res.status(400).json({ error: 'Faltan datos para enviar el ticket.' });
    }

    if (!smtpConfigCompleta()) {
        return res.status(500).json({
            error: 'Correo no configurado. Agrega SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD en backend/.env.'
        });
    }

    try {
        const transporter = crearTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        const attachments = ticketPdfBase64
            ? [{
                filename: `Ticket_Venta_${folio}.pdf`,
                content: Buffer.from(ticketPdfBase64, 'base64'),
                contentType: 'application/pdf'
            }]
            : [{
                filename: `Ticket_Venta_${folio}.html`,
                content: ticketHtml,
                contentType: 'text/html; charset=utf-8'
            }];

        await transporter.sendMail({
            from,
            to: correo,
            subject: `Ticket de compra ${folio} - Vivero La Palma`,
            text: `Gracias por su compra. Se adjunta el ticket ${folio}.`,
            html: `
                <p>Gracias por su compra en <strong>Vivero La Palma</strong>.</p>
                <p>Adjuntamos su ticket <strong>${folio}</strong>.</p>
            `,
            attachments
        });

        res.json({ mensaje: 'Ticket enviado por correo.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    enviarTicketCorreo
};
