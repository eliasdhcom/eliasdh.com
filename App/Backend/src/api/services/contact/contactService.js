/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 17/12/2025
**/

const mailer = require('../mailer/mailerService');
const logger = require('../../../utils/logger');

class ContactService {

    async submitContactForm(contactData) {
        const { name, email, subject, message } = contactData;
        if (!name || !email || !subject || !message) throw new Error('All fields are required');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw new Error('Invalid email format');

        const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Brussels' });

        const internalBody = `
            <p style="font-size:15px;color:#333;margin:0 0 6px 0;"><strong>From:</strong> ${name}</p>
            <p style="font-size:15px;color:#333;margin:0 0 6px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color:#4f94f0;">${email}</a></p>
            <p style="font-size:15px;color:#333;margin:0 0 16px 0;"><strong>Subject:</strong> ${subject}</p>
            <div style="background:#f6f7f9;border-left:4px solid #4f94f0;border-radius:0 8px 8px 0;padding:20px;">
                <p style="font-size:14px;color:#555;margin:0;line-height:1.6;white-space:pre-wrap;">${message}</p>
            </div>
            <p style="font-size:12px;color:#aaa;margin:20px 0 0 0;">Received at: ${timestamp}</p>
        `;

        const confirmBody = `
            <p style="font-size:15px;color:#555;margin:0 0 20px 0;">Hello <strong>${name}</strong>,</p>
            <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 20px 0;">
                Thank you for your message! We have received it and will get back to you as soon as possible.
            </p>
            <div style="background:#f6f7f9;border-left:4px solid #4f94f0;border-radius:0 8px 8px 0;padding:20px;margin:0 0 28px 0;">
                <p style="font-size:13px;color:#333;margin:0 0 6px 0;"><strong>Your message:</strong></p>
                <p style="font-size:14px;color:#555;margin:0;line-height:1.6;white-space:pre-wrap;">${message}</p>
            </div>
            <p style="font-size:15px;color:#555;margin:0;">Kind regards,<br><strong style="color:#4f94f0;">The EliasDH team</strong></p>
        `;

        if (!mailer.smtpConfigured) {
            logger.warn('Contact form received but email NOT sent: SMTP not configured');
        } else {
            try {
                await mailer.send({
                    from:    `"${name}" <${process.env.SMTP_USER}>`,
                    to:      'info@eliasdh.com',
                    replyTo: email,
                    subject: `[Website Contact] ${subject}`,
                    html:    mailer.layout({ headerTitle: 'New contact message', body: internalBody })
                });
                logger.info('Contact email sent to info@eliasdh.com');

                await mailer.send({
                    to:      email,
                    subject: 'Confirmation: Your message has been received — EliasDH',
                    html:    mailer.layout({ headerTitle: 'Confirmation', body: confirmBody })
                });
                logger.info(`Confirmation email sent to ${email}`);
            } catch (err) {
                logger.error('Error sending contact emails:', err.message);
            }
        }

        return { success: true, data: { submittedAt: new Date().toISOString() } };
    }

    async getContactStats() {
        return { totalSubmissions: 0, lastSubmission: null };
    }
}

module.exports = new ContactService();