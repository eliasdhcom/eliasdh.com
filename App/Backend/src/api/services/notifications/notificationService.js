/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

const mailer = require('../mailer/mailerService');
const logger = require('../../../utils/logger');

class NotificationService {

    async sendNodeOfflineNotification(nodeName, nodeDetails = {}) {
        try {
            await this._sendNodeAlert(nodeName, nodeDetails, 'OFFLINE');
            logger.info(`Email alert sent for offline node: ${nodeName}`);
        } catch (error) {
            logger.error(`Failed to send email alert for node ${nodeName}: ${error.message}`);
        }
    }

    async sendNodeOnlineNotification(nodeName, nodeDetails = {}) {
        try {
            await this._sendNodeAlert(nodeName, nodeDetails, 'ONLINE');
            logger.info(`Email recovery alert sent for node: ${nodeName}`);
        } catch (error) {
            logger.error(`Failed to send email recovery alert for node ${nodeName}: ${error.message}`);
        }
    }

    async _sendNodeAlert(nodeName, nodeDetails, status) {
        const isOffline    = status === 'OFFLINE';
        const headerBg     = isOffline ? '#dc3545' : '#28a745';
        const accentColor  = headerBg;
        const timestamp    = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Brussels' });
        const label        = isOffline ? 'OFFLINE' : 'ONLINE';
        const headerTitle  = isOffline ? 'Node Offline Alert' : 'Node Recovery Alert';
        const timeLabel    = isOffline ? 'Detected At' : 'Recovered At';

        const extraRows = [
            nodeDetails.lastKnownStatus ? `<p style="font-size:14px;color:#333;margin:5px 0;"><strong>Previous Status:</strong> ${nodeDetails.lastKnownStatus}</p>` : '',
            nodeDetails.reason          ? `<p style="font-size:14px;color:#333;margin:5px 0;"><strong>Reason:</strong> ${nodeDetails.reason}</p>` : '',
            nodeDetails.message         ? `<p style="font-size:14px;color:#333;margin:5px 0;"><strong>Message:</strong> ${nodeDetails.message}</p>` : ''
        ].join('');

        const body = `
            <p style="font-size:14px;color:#333;margin:0 0 4px 0;"><strong>Node:</strong> ${nodeName}</p>
            <p style="font-size:14px;color:#333;margin:0 0 4px 0;"><strong>Status:</strong> <span style="color:${accentColor};font-weight:700;">${label}</span></p>
            <p style="font-size:14px;color:#333;margin:0 0 4px 0;"><strong>${timeLabel}:</strong> ${timestamp}</p>
            ${extraRows}
            ${mailer.banner(
                isOffline
                    ? '<strong>⚠️ Action Required:</strong> Please investigate and take necessary actions to bring the node back online.'
                    : '<strong>✅ Good news:</strong> The node has recovered and is back online.',
                isOffline ? '#ffc107' : '#28a745',
                isOffline ? '#fff3cd' : '#d4edda'
            )}
        `;

        await mailer.send({
            to:      process.env.ALERT_EMAIL,
            subject: isOffline ? `🚨 ALERT: Node ${nodeName} is OFFLINE` : `✅ RECOVERED: Node ${nodeName} is back ONLINE`,
            html:    mailer.layout({ headerTitle, headerBg, body })
        });
    }

    async sendWelcomeEmail(user) {
        const body = `
            <h2 style="color:#1a1a2e;margin:0 0 10px 0;font-size:22px;">Welcome, ${user.firstName}!</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
                An account has been created for you on the EliasDH platform.
            </p>
            ${mailer.infoTable([
                ['Email address', user.email],
                ['Role',          user.role],
                ['Company',       user.company]
            ])}
            <p style="color:#555;font-size:15px;line-height:1.6;margin:20px 0;">
                To set your password, click the button below to go to the login page and then click <strong>"Forgot Password"</strong>. You will receive a code by email to set a new password.
            </p>
            ${mailer.button('Go to login', 'https://eliasdh.com/login')}
        `;

        await mailer.send({
            to:      user.email,
            subject: `Welcome to EliasDH, ${user.firstName}!`,
            html:    mailer.layout({ headerTitle: 'Your account has been created', body })
        });
        logger.info(`Welcome email sent to ${user.email}`);
    }
}

module.exports = new NotificationService();