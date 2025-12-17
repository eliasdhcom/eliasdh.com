/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 17/12/2025
**/

const nodemailer = require('nodemailer');
const logger = require('../../../utils/logger');

class ContactService {
    constructor() {
        this.smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        
        if (this.smtpConfigured) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            logger.info('SMTP transporter configured successfully');
        } else {
            logger.warn('SMTP not configured. Missing environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS');
            this.transporter = null;
        }
    }

    async submitContactForm(contactData) {
        try {
            const { name, email, subject, message } = contactData;
            if (!name || !email || !subject || !message) throw new Error('All fields are required');

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) throw new Error('Invalid email format');

            const mailOptions = {
                from: `"${name}" <${process.env.SMTP_USER}>`,
                to: 'info@eliasdh.com',
                replyTo: email,
                subject: `[Website Contact] ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #0f54ae 0%, #4f94f0 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                            <h2 style="color: #ffffff; margin: 0;">New Contact Message</h2>
                        </div>
                        <div style="background: #f6f7f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p style="font-size: 16px; color: #333333;"><strong>From:</strong> ${name}</p>
                            <p style="font-size: 16px; color: #333333;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0f54ae;">${email}</a></p>
                            <p style="font-size: 16px; color: #333333;"><strong>Subject:</strong> ${subject}</p>
                            <hr style="border: none; border-top: 2px solid #0f54ae; margin: 20px 0;">
                            <p style="font-size: 16px; color: #333333;"><strong>Message:</strong></p>
                            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0f54ae;">
                                <p style="font-size: 15px; color: #555555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                            </div>
                            <p style="font-size: 12px; color: #888888; margin-top: 20px;">
                                Sent on: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Brussels' })}
                            </p>
                        </div>
                    </div>
                `
            };

            const confirmationMailOptions = {
                from: `"EliasDH Team" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Confirmation: Your message has been received',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #0f54ae 0%, #4f94f0 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                            <h2 style="color: #ffffff; margin: 0;">Thank you for your message!</h2>
                        </div>
                        <div style="background: #f6f7f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p style="font-size: 16px; color: #333333; margin-bottom: 30px;">Hello ${name}</p>
                            <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                                Thank you for contacting EliasDH! We have successfully received your message and will respond as soon as possible.
                            </p>
                            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0f54ae; margin: 20px 0;">
                                <p style="font-size: 14px; color: #333333; margin: 0;"><strong>Your message:</strong></p>
                                <p style="font-size: 14px; color: #555555; margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
                            </div>
                            <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-top: 30px;">
                                Kind regards<br>
                                <strong>The EliasDH Team</strong>
                            </p>
                            <hr style="border: none; border-top: 1px solid #dddddd; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888888; text-align: center;">
                                EliasDH | <a href="https://eliasdh.com" style="color: #0f54ae;">eliasdh.com</a>
                            </p>
                        </div>
                    </div>
                `
            };

            if (!this.transporter) {
                logger.error('SMTP not configured! Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
                logger.info('Contact form data received but email NOT sent due to missing SMTP config');
            } else {
                try {
                    await this.transporter.sendMail(mailOptions);
                    logger.info('Contact email sent successfully to info@eliasdh.com');
                    
                    await this.transporter.sendMail(confirmationMailOptions);
                    logger.info(`Confirmation email sent to ${email}`);
                } catch (emailError) {
                    logger.error('Error sending email:', emailError.message);
                    logger.error('Full error:', JSON.stringify(emailError, null, 2));
                    logger.warn('Email delivery failed, but form was processed');
                }
            }

            return {
                success: true,
                message: 'Contact form submitted successfully',
                data: {
                    submittedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('Error processing contact form:', error);
            throw error;
        }
    }

    async getContactStats() {
        try {
            return {
                totalSubmissions: 0,
                lastSubmission: null
            };
        } catch (error) {
            logger.error('Error getting contact stats:', error);
            throw error;
        }
    }
}

module.exports = new ContactService();