/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express              = require('express');
const { param, body, validationResult } = require('express-validator');
const { jwtAuth }          = require('../../../middleware/jwtAuth');
const usersService         = require('../../services/users/usersService');
const notificationService  = require('../../services/notifications/notificationService');
const logsService          = require('../../services/logs/logsService');

const router = express.Router();

router.use(jwtAuth);

const logActor = req => ({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
    ipAddress: req.ip
});

router.get('/', async (req, res, next) => {
    try {
        const users = await usersService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ success: false, error: 'Ongeldig gebruikers-ID.' });
        }
        const user = await usersService.getUserById(id);
        if (!user) return res.status(404).json({ success: false, error: 'Gebruiker niet gevonden.' });
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
});

router.post('/',
    body('email').isEmail().trim(),
    body('password').isLength({ min: 8 }),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('role').optional().isString().trim(),
    body('company').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('birthDate').optional().isString().trim(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const id = await usersService.createUser(req.body);
            const created = await usersService.getUserById(id);
            notificationService.sendWelcomeEmail(created).catch(() => {});
            logsService.addLog({ ...logActor(req), action: 'CREATE', resourceId: id, details: `User: ${created?.email}` });
            res.status(201).json({ success: true, data: created });
        } catch (err) {
            if (err.message?.includes('UNIQUE')) {
                return res.status(409).json({ success: false, error: 'Dit e-mailadres is al in gebruik.' });
            }
            next(err);
        }
    }
);

router.patch('/:id/active',
    param('id').isInt({ min: 1 }),
    body('active').isBoolean(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await usersService.setActive(Number(req.params.id), req.body.active);
            logsService.addLog({ ...logActor(req), action: 'TOGGLE', resourceId: req.params.id, details: `User toggled: ${req.body.active ? 'Activated' : 'Deactivated'}` });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

router.patch('/:id',
    param('id').isInt({ min: 1 }),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('email').optional().isEmail().trim(),
    body('role').optional().isString().trim(),
    body('company').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('birthDate').optional().isString().trim(),
    body('avatar').optional({ nullable: true }).isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await usersService.updateUser(Number(req.params.id), req.body);
            logsService.addLog({ ...logActor(req), action: 'UPDATE', resourceId: req.params.id, details: 'User updated' });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

router.delete('/:id',
    param('id').isInt({ min: 1 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await usersService.deleteUser(Number(req.params.id));
            logsService.addLog({ ...logActor(req), action: 'DELETE', resourceId: req.params.id, details: 'User deleted' });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;