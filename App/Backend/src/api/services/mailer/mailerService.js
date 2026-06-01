/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/06/2026
**/

const nodemailer = require('nodemailer');
const logger     = require('../../../utils/logger');

const BRAND_COLOR  = '#4f94f0';
const BRAND_FOOTER = '#f0f5ff';

class MailerService {
    constructor() {
        this.smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

        if (this.smtpConfigured) {
            this.transporter = nodemailer.createTransport({
                host:   process.env.SMTP_HOST,
                port:   parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth:   { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || '').replace(/\s/g, '') }
            });
            logger.info('Mailer: SMTP transporter configured');
        } else {
            logger.warn('Mailer: SMTP not configured — emails will not be sent');
            this.transporter = null;
        }
    }

    get defaultFrom() { return `"EliasDH" <${process.env.SMTP_USER}>`; }

    async send(options) {
        if (!this.transporter) {
            logger.warn(`Email not sent (SMTP unconfigured): ${options.subject}`);
            return;
        }
        await this.transporter.sendMail({ from: this.defaultFrom, ...options });
    }

    layout({ headerTitle, headerBg = BRAND_COLOR, body }) {
        return `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,84,174,0.12);">
                <div style="background:${headerBg};padding:28px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.5px;">EliasDH</span></td>
                        <td align="right"><span style="font-size:12px;color:rgba(255,255,255,0.75);">${headerTitle}</span></td>
                    </tr></table>
                </div>
                <div style="background:#fff;padding:36px 32px;">${body}</div>
                <div style="background:${BRAND_FOOTER};padding:14px 32px;text-align:center;">
                    <p style="font-size:12px;color:#7a96c2;margin:0;">EliasDH &nbsp;·&nbsp; <a href="https://eliasdh.com" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">eliasdh.com</a></p>
                </div>
            </div>
        `;
    }

    button(label, url, bg = BRAND_COLOR) {
        return `<div style="text-align:center;margin:28px 0;">
            <a href="${url}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">${label}</a>
        </div>`;
    }

    infoTable(rows) {
        const trs = rows.map(([label, value], i) => `
            <tr>
                <td style="padding:8px 0;color:#888;width:160px;${i > 0 ? 'border-top:1px solid #f3f4f6;' : ''}">${label}</td>
                <td style="padding:8px 0;color:#1a1a2e;font-weight:600;${i > 0 ? 'border-top:1px solid #f3f4f6;' : ''}">${value || '—'}</td>
            </tr>`).join('');
        return `<div style="background:#f6f7f9;border-radius:10px;padding:24px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">${trs}</table>
        </div>`;
    }

    banner(text, color = '#f59e0b', bg = '#fff8e1') {
        return `<div style="background:${bg};border-left:4px solid ${color};border-radius:6px;padding:14px 18px;margin:20px 0;">
            <p style="margin:0;font-size:13px;color:#555;">${text}</p>
        </div>`;
    }
}

module.exports = new MailerService();