/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

const nodemailer = require('nodemailer');
const logger = require('../../../utils/logger');

class NotificationService {
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
            logger.info('Notification service: SMTP transporter configured');
        } else {
            logger.warn('Notification service: SMTP not configured');
            this.transporter = null;
        }

        this.alertEmail = process.env.ALERT_EMAIL;
    }

    async sendNodeOfflineNotification(nodeName, nodeDetails = {}) {
        const timestamp = new Date().toISOString();
        const results = {
            email: { sent: false, error: null }
        };

        try {
            await this.sendEmailAlert(nodeName, nodeDetails, timestamp);
            results.email.sent = true;
            logger.info(`Email alert sent for offline node: ${nodeName}`);
        } catch (error) {
            results.email.error = error.message;
            logger.error(`Failed to send email alert for node ${nodeName}: ${error.message}`);
        }

        return results;
    }

    async sendEmailAlert(nodeName, nodeDetails, timestamp) {
        if (!this.transporter) {
            throw new Error('SMTP not configured');
        }

        const mailOptions = {
            from: `"EliasDH Alerts" <${process.env.SMTP_USER}>`,
            to: this.alertEmail,
            subject: `🚨 ALERT: Node ${nodeName} is OFFLINE`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #ffffff; margin: 0;">🚨 Node Offline Alert</h2>
                    </div>
                    <div style="background: #f6f7f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
                            <h3 style="color: #dc3545; margin: 0 0 15px 0;">Node: ${nodeName}</h3>
                            <p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">OFFLINE</span></p>
                            <p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Detected At:</strong> ${new Date(timestamp).toLocaleString('en-GB', { timeZone: 'Europe/Brussels' })}</p>
                            ${nodeDetails.lastKnownStatus ? `<p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Previous Status:</strong> ${nodeDetails.lastKnownStatus}</p>` : ''}
                            ${nodeDetails.reason ? `<p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Reason:</strong> ${nodeDetails.reason}</p>` : ''}
                            ${nodeDetails.message ? `<p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Message:</strong> ${nodeDetails.message}</p>` : ''}
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <p style="font-size: 14px; color: #856404; margin: 0;">
                                <strong>⚠️ Action Required:</strong> Please investigate and take necessary actions to bring the node back online.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #dddddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888888; text-align: center;">
                            EliasDH Cluster Monitoring | <a href="https://eliasdh.com" style="color: #0f54ae;">eliasdh.com</a>
                        </p>
                    </div>
                </div>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendNodeOnlineNotification(nodeName, nodeDetails = {}) {
        const timestamp = new Date().toISOString();
        const results = {
            email: { sent: false, error: null }
        };

        try {
            await this.sendEmailRecoveryAlert(nodeName, nodeDetails, timestamp);
            results.email.sent = true;
            logger.info(`Email recovery alert sent for node: ${nodeName}`);
        } catch (error) {
            results.email.error = error.message;
            logger.error(`Failed to send email recovery alert for node ${nodeName}: ${error.message}`);
        }

        return results;
    }

    async sendEmailRecoveryAlert(nodeName, nodeDetails, timestamp) {
        if (!this.transporter) {
            throw new Error('SMTP not configured');
        }

        const mailOptions = {
            from: `"EliasDH Alerts" <${process.env.SMTP_USER}>`,
            to: this.alertEmail,
            subject: `✅ RECOVERED: Node ${nodeName} is back ONLINE`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #ffffff; margin: 0;">✅ Node Recovery Alert</h2>
                    </div>
                    <div style="background: #f6f7f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                            <h3 style="color: #28a745; margin: 0 0 15px 0;">Node: ${nodeName}</h3>
                            <p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ONLINE</span></p>
                            <p style="font-size: 14px; color: #333333; margin: 5px 0;"><strong>Recovered At:</strong> ${new Date(timestamp).toLocaleString('en-GB', { timeZone: 'Europe/Brussels' })}</p>
                        </div>
                        
                        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <p style="font-size: 14px; color: #155724; margin: 0;">
                                <strong>✅ Good news:</strong> The node has recovered and is back online.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #dddddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888888; text-align: center;">
                            EliasDH Cluster Monitoring | <a href="https://eliasdh.com" style="color: #0f54ae;">eliasdh.com</a>
                        </p>
                    </div>
                </div>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new NotificationService();