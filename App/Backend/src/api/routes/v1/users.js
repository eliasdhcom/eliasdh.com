/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express              = require('express');
const { param, body, validationResult } = require('express-validator');
const { jwtAuth }          = require('../../../middleware/jwtAuth');
const { requireAdmin }     = require('../../../middleware/requireAdmin');
const { resolveSelectedCustomer } = require('../../../middleware/resolveSelectedCustomer');
const usersService         = require('../../services/users/usersService');
const notificationService  = require('../../services/notifications/notificationService');
const logsService          = require('../../services/logs/logsService');

const router = express.Router();

router.use(jwtAuth);

const requireAdminOrSelf = (req, res, next) => {
    if ((req.user?.role ?? '').toLowerCase() === 'admin') return next();
    if (req.user?.id === Number(req.params.id)) return next();
    return res.status(403).json({ success: false, error: 'Access denied.' });
};

const logActor = req => ({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
    ipAddress: req.ip
});

router.get('/', async (req, res, next) => {
    try {
        const role = (req.user?.role ?? '').toLowerCase();
        if (role === 'admin') {
            return res.json({ success: true, data: await usersService.getAllUsers() });
        }
        if (role === 'customer') {
            const customerId = resolveSelectedCustomer(req);
            if (!customerId) return res.status(403).json({ success: false, error: 'Access denied.' });
            return res.json({ success: true, data: await usersService.getUsersByCustomer(customerId) });
        }
        return res.status(403).json({ success: false, error: 'Access denied.' });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', requireAdminOrSelf, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ success: false, error: 'Invalid user ID.' });
        }
        const user = await usersService.getUserById(id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
});

router.post('/',
    requireAdmin,
    body('email').isEmail().trim(),
    body('password').isLength({ min: 8 }),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('role').optional().isString().trim(),
    body('company').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('birthDate').optional().isString().trim(),
    body('customerIds').optional({ nullable: true }).isArray(),
    body('customerIds.*').isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const id = await usersService.createUser(req.body);
            const created = await usersService.getUserById(id);
            notificationService.sendWelcomeEmail(created).catch(() => {});
            logsService.addLog({
                ...logActor(req),
                action:     'CREATE',
                resource:   'user',
                resourceId: id,
                details:    `User created: ${created?.email} (${created?.firstName} ${created?.lastName})`
            });
            res.status(201).json({ success: true, data: created });
        } catch (err) {
            if (err.message?.includes('UNIQUE')) {
                return res.status(409).json({ success: false, error: 'This email address is already in use.' });
            }
            next(err);
        }
    }
);

router.patch('/:id/active',
    requireAdmin,
    param('id').isInt({ min: 1 }),
    body('active').isBoolean(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await usersService.setActive(Number(req.params.id), req.body.active);
            logsService.addLog({
                ...logActor(req),
                action:     'TOGGLE',
                resource:   'user',
                resourceId: req.params.id,
                details:    `User ${req.body.active ? 'activated' : 'deactivated'} (ID: ${req.params.id})`
            });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

router.patch('/:id',
    requireAdmin,
    param('id').isInt({ min: 1 }),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('email').optional().isEmail().trim(),
    body('role').optional().isString().trim(),
    body('company').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('birthDate').optional().isString().trim(),
    body('avatar').optional({ nullable: true }).isString(),
    body('customerIds').optional({ nullable: true }).isArray(),
    body('customerIds.*').isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const changedFields = Object.keys(req.body).filter(k => k !== 'avatar');
            await usersService.updateUser(Number(req.params.id), req.body);

            const fieldLabels = {
                firstName: 'first name', lastName: 'last name', email: 'email',
                role: 'role', company: 'company', phone: 'phone', birthDate: 'birth date', avatar: 'avatar',
                customerIds: 'companies'
            };
            const changed = Object.keys(req.body)
                .map(k => fieldLabels[k] ?? k)
                .join(', ');

            logsService.addLog({
                ...logActor(req),
                action:     'UPDATE',
                resource:   'user',
                resourceId: req.params.id,
                details:    `User updated (ID: ${req.params.id}): ${changed || 'no fields'}`
            });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

router.delete('/:id',
    requireAdmin,
    param('id').isInt({ min: 1 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const user = await usersService.getUserById(Number(req.params.id));
            await usersService.deleteUser(Number(req.params.id));
            logsService.addLog({
                ...logActor(req),
                action:     'DELETE',
                resource:   'user',
                resourceId: req.params.id,
                details:    `User deleted: ${user?.email ?? ''} (ID: ${req.params.id})`
            });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
