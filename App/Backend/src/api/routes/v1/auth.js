/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express     = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../../services/auth/authService');
const logsService = require('../../services/logs/logsService');

const router = express.Router();

router.post('/login',
    body('email').isEmail().trim(),
    body('password').notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: 'Ongeldige invoer.' });
            }

            const result = await authService.login(req.body.email, req.body.password);
            if (!result) {
                return res.status(401).json({ success: false, error: 'Ongeldig e-mailadres of wachtwoord.' });
            }
            if (result.blocked) {
                return res.status(403).json({ success: false, error: 'Uw account is gedeactiveerd. Neem contact op met de beheerder.' });
            }

            logsService.addLog({
                userId:    result.user.id,
                userEmail: result.user.email,
                userName:  `${result.user.firstName ?? ''} ${result.user.lastName ?? ''}`.trim(),
                action:    'LOGIN',
                resource:  'auth',
                details:   'Ingelogd',
                ipAddress: req.ip
            });
            res.json({ success: true, token: result.token, data: result.user });
        } catch (err) {
            next(err);
        }
    }
);

router.post('/forgot-password',
    body('email').isEmail().trim(),
    async (req, res, next) => {
        try {
            if (!validationResult(req).isEmpty())
                return res.status(400).json({ success: false, error: 'Ongeldig e-mailadres.' });
            await authService.forgotPassword(req.body.email);
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

router.post('/verify-reset-code',
    body('email').isEmail().trim(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    async (req, res, next) => {
        try {
            if (!validationResult(req).isEmpty())
                return res.status(400).json({ success: false, error: 'Ongeldige invoer.' });
            const valid = await authService.verifyResetCode(req.body.email, req.body.code);
            if (!valid) return res.status(400).json({ success: false, error: 'Ongeldige of verlopen code.' });
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

router.post('/reset-password',
    body('email').isEmail().trim(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    body('password').isLength({ min: 8 }),
    async (req, res, next) => {
        try {
            if (!validationResult(req).isEmpty())
                return res.status(400).json({ success: false, error: 'Ongeldige invoer.' });
            const ok = await authService.resetPassword(req.body.email, req.body.code, req.body.password);
            if (!ok) return res.status(400).json({ success: false, error: 'Ongeldige of verlopen code.' });
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

module.exports = router;