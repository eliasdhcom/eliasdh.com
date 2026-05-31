/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const nodemailer = require('nodemailer');
const dayjs      = require('dayjs');
const { getDb }  = require('../../../database/db');
const logger     = require('../../../utils/logger');

function createTransporter() {
    return nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth:   { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || '').replace(/\s/g, '') }
    });
}

function calcAge(birthDate, today) {
    const birth = dayjs(birthDate);
    return today.year() - birth.year();
}

function buildEmail(user, age) {
    const name     = user.first_name || 'there';
    const emojis   = ['🎂', '🥳', '🎉', '🎈', '✨', '🎁'];
    const confetti = emojis.join(' ');

    return {
        from:    `"EliasDH" <${process.env.SMTP_USER}>`,
        to:      user.email,
        subject: `${confetti} Happy Birthday, ${name}! ${confetti}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(79,148,240,0.13);">
            <div style="background:linear-gradient(135deg,#4f94f0 0%,#7bb8f7 100%);padding:32px;text-align:center;">
                <div style="font-size:52px;margin-bottom:8px;">🎂</div>
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:0.5px;">Happy Birthday!</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Hey ${name}, today is all about you! 🥳</p>
            </div>
            <div style="background:#fff;padding:36px 32px;">
                <p style="font-size:16px;color:#333;line-height:1.7;margin:0 0 20px;">
                    <strong style="color:#4f94f0;">Wow, ${age} years old!</strong> 🎉 That deserves a celebration!<br><br>
                    From everyone at <strong>EliasDH</strong>, we wish you a fantastic birthday — full of cake 🍰, joy, and everything your heart desires.
                </p>
                <div style="background:#f0f7ff;border-left:4px solid #4f94f0;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
                    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;font-style:italic;">
                        🤖 <em>Psst… yes, we know — this is an automated email. But trust us, behind this little digital message is a genuinely warm thought. Sometimes the smallest gestures mean the most. Enjoy your day!</em> 🎈
                    </p>
                </div>
                <p style="font-size:14px;color:#555;margin:0;">
                    With love and many happy returns,<br>
                    <strong style="color:#4f94f0;">The EliasDH team</strong> 💙
                </p>
            </div>
            <div style="background:#f0f5ff;padding:14px 32px;text-align:center;">
                <p style="font-size:12px;color:#7a96c2;margin:0;">EliasDH &nbsp;·&nbsp; <a href="https://eliasdh.com" style="color:#4f94f0;text-decoration:none;font-weight:600;">eliasdh.com</a></p>
            </div>
        </div>`
    };
}

// In-memory deduplication: tracks which user IDs got a mail today
const _sentToday   = new Set();
let   _lastRunDate = '';

async function checkAndSendBirthdays() {
    const today    = dayjs();
    const todayStr = today.format('YYYY-MM-DD');
    const mm       = String(today.month() + 1).padStart(2, '0');
    const dd       = String(today.date()).padStart(2, '0');

    if (todayStr !== _lastRunDate) {
        _sentToday.clear();
        _lastRunDate = todayStr;
    }

    const { rows: users } = await getDb().execute({
        sql:  `SELECT id, email, first_name, birth_date FROM users
               WHERE active = 1
                 AND birth_date IS NOT NULL
                 AND birth_date != ''
                 AND strftime('%m-%d', birth_date) = ?`,
        args: [`${mm}-${dd}`]
    });

    if (!users.length) return;

    const transporter = createTransporter();

    for (const user of users) {
        const key = String(user.id);
        if (_sentToday.has(key)) continue;
        _sentToday.add(key);

        const age  = calcAge(user.birth_date, today);
        const mail = buildEmail(user, age);
        await transporter.sendMail(mail);
        logger.info(`Birthday email sent to ${user.email} (age ${age})`);
    }
}

function startBirthdayScheduler() {
    checkAndSendBirthdays().catch(err => logger.error('Birthday check failed:', err.message));

    setInterval(() => {
        checkAndSendBirthdays().catch(err => logger.error('Birthday check failed:', err.message));
    }, 24 * 60 * 60 * 1000);

    logger.info('Birthday scheduler started (daily).');
}

module.exports = { startBirthdayScheduler };
