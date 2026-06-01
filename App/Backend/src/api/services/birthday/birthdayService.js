/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const dayjs  = require('dayjs');
const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');
const mailer    = require('../mailer/mailerService');

const EMOJIS = ['🎂', '🥳', '🎉', '🎈', '✨', '🎁'];

function calcAge(birthDate, today) {
    return today.year() - dayjs(birthDate).year();
}

function buildBirthdayBody(name, age) {
    const confetti = EMOJIS.join(' ');
    return `
        <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:52px;margin-bottom:8px;">🎂</div>
            <h1 style="margin:0;color:#4f94f0;font-size:24px;font-weight:800;">Happy Birthday, ${name}!</h1>
            <p style="color:#888;font-size:14px;margin:6px 0 0 0;">${confetti}</p>
        </div>
        <p style="font-size:16px;color:#333;line-height:1.7;margin:0 0 20px 0;">
            <strong style="color:#4f94f0;">Wow, ${age} jaar!</strong> 🎉 Dat verdient een feestje!<br><br>
            Van iedereen bij <strong>EliasDH</strong> wensen we u een geweldige verjaardag toe — vol taart 🍰, vreugde en alles wat uw hart begeert.
        </p>
        <div style="background:#f0f7ff;border-left:4px solid #4f94f0;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
            <p style="margin:0;font-size:13px;color:#666;line-height:1.6;font-style:italic;">
                🤖 <em>Ja, dit is een geautomatiseerde e-mail — maar achter dit digitale berichtje zit een oprecht warme gedachte. Geniet van uw dag!</em> 🎈
            </p>
        </div>
        <p style="font-size:14px;color:#555;margin:0;">
            Met vriendelijke groeten,<br>
            <strong style="color:#4f94f0;">Het EliasDH team</strong> 💙
        </p>
    `;
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

    for (const user of users) {
        const key = String(user.id);
        if (_sentToday.has(key)) continue;
        _sentToday.add(key);

        const name = user.first_name || 'there';
        const age  = calcAge(user.birth_date, today);

        await mailer.send({
            to:      user.email,
            subject: `${EMOJIS.join(' ')} Happy Birthday, ${name}! ${EMOJIS.join(' ')}`,
            html:    mailer.layout({
                headerTitle: 'Fijne verjaardag!',
                headerBg:    'linear-gradient(135deg, #4f94f0 0%, #7bb8f7 100%)',
                body:        buildBirthdayBody(name, age)
            })
        });
        logger.info(`Birthday email sent to ${user.email} (age ${age})`);
    }
}

function startBirthdayScheduler() {
    checkAndSendBirthdays().catch(err => logger.error('Birthday check failed:', err.message));
    setInterval(
        () => checkAndSendBirthdays().catch(err => logger.error('Birthday check failed:', err.message)),
        24 * 60 * 60 * 1000
    );
    logger.info('Birthday scheduler started (daily).');
}

module.exports = { startBirthdayScheduler };
