/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express     = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../../services/auth/authService');
const logsService = require('../../services/logs/logsService');
const { jwtAuth } = require('../../../middleware/jwtAuth');

const router = express.Router();

router.post('/login',
    body('email').isEmail().trim(),
    body('password').notEmpty(),
    body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: 'Invalid input.' });
            }

            const latitude  = req.body.latitude  != null ? Number(req.body.latitude)  : null;
            const longitude = req.body.longitude != null ? Number(req.body.longitude) : null;

            const result = await authService.login(req.body.email, req.body.password);
            if (!result) {
                logsService.addLog({
                    userEmail: req.body.email,
                    action:    'LOGIN',
                    resource:  'auth',
                    details:   'Failed login attempt',
                    ipAddress: req.ip
                });
                return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
            }
            if (result.blocked) {
                return res.status(403).json({ success: false, error: 'Your account is deactivated. Please contact the administrator.' });
            }

            logsService.addLog({
                userId:    result.user.id,
                userEmail: result.user.email,
                userName:  `${result.user.firstName ?? ''} ${result.user.lastName ?? ''}`.trim(),
                action:    'LOGIN',
                resource:  'auth',
                details:   'Successfully logged in',
                ipAddress: req.ip,
                latitude,
                longitude
            });
            res.json({ success: true, token: result.token, data: result.user });
        } catch (err) {
            next(err);
        }
    }
);

router.post('/login-location',
    jwtAuth,
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    async (req, res, next) => {
        try {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).json({ success: false, error: 'Invalid coordinates.' });
            }
            await logsService.updateLastLoginLocation(req.user.id, Number(req.body.latitude), Number(req.body.longitude));
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

router.post('/logout', jwtAuth, async (req, res, next) => {
    try {
        logsService.addLog({
            userId:    req.user?.id,
            userEmail: req.user?.email,
            userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
            action:    'LOGOUT',
            resource:  'auth',
            details:   'Logged out',
            ipAddress: req.ip
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.post('/forgot-password',
    body('email').isEmail().trim(),
    async (req, res, next) => {
        try {
            if (!validationResult(req).isEmpty())
                return res.status(400).json({ success: false, error: 'Invalid email address.' });
            await authService.forgotPassword(req.body.email);
            logsService.addLog({
                userEmail: req.body.email,
                action:    'PASSWORD_RESET',
                resource:  'auth',
                details:   'Password reset requested',
                ipAddress: req.ip
            });
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
                return res.status(400).json({ success: false, error: 'Invalid input.' });
            const valid = await authService.verifyResetCode(req.body.email, req.body.code);
            if (!valid) return res.status(400).json({ success: false, error: 'Invalid or expired code.' });
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
                return res.status(400).json({ success: false, error: 'Invalid input.' });
            const ok = await authService.resetPassword(req.body.email, req.body.code, req.body.password);
            if (!ok) return res.status(400).json({ success: false, error: 'Invalid or expired code.' });
            logsService.addLog({
                userEmail: req.body.email,
                action:    'PASSWORD_RESET',
                resource:  'auth',
                details:   'Password successfully reset',
                ipAddress: req.ip
            });
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

module.exports = router;
