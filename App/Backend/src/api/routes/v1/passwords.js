/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

const express    = require('express');
const bcrypt     = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const passwordsService = require('../../services/passwords/passwordsService');
const logsService      = require('../../services/logs/logsService');
const vaultTokenStore  = require('../../services/vault/vaultTokenStore');
const { getDb }           = require('../../../database/db');
const { jwtAuth }         = require('../../../middleware/jwtAuth');
const { requireAdmin }    = require('../../../middleware/requireAdmin');
const { requireVaultAuth } = require('../../../middleware/requireVaultAuth');
const logger = require('../../../utils/logger');
const router = express.Router();

router.use(jwtAuth, requireAdmin);

const logActor = req => ({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
    ipAddress: req.ip
});

router.get('/', async (req, res, next) => {
    try {
        const { search } = req.query;
        const data = await passwordsService.getAll({ search });
        res.json({ success: true, data });
    } catch (err) {
        logger.error(`Error fetching password entries: ${err.message}`);
        next(err);
    }
});

router.post('/verify',
    body('password').isString().notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const { rows } = await getDb().execute({
                sql:  'SELECT password_hash FROM users WHERE id = ?',
                args: [req.user.id]
            });
            const valid = rows.length && await bcrypt.compare(req.body.password, rows[0].password_hash);
            if (!valid) return res.status(401).json({ success: false, error: 'Incorrect password.' });

            const { token, expiresAt } = vaultTokenStore.issue(req.user.id);
            logsService.addLog({ ...logActor(req), action: 'VAULT_UNLOCK', resource: 'password_entry', details: 'Vault unlocked' });
            res.json({ success: true, token, expiresAt });
        } catch (err) { next(err); }
    }
);

router.post('/',
    body('serviceName').isString().notEmpty(),
    body('password').isString().notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const entry = await passwordsService.create(req.body, req.user.id);
            logsService.addLog({
                ...logActor(req),
                action:     'CREATE',
                resource:   'password_entry',
                resourceId: entry.id,
                details:    `Password entry created: "${entry.serviceName}"`
            });
            res.status(201).json({ success: true, data: entry });
        } catch (err) { next(err); }
    }
);

router.put('/:id',
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const id      = Number(req.params.id);
            const updated = await passwordsService.update(id, req.body, req.user.id);
            if (!updated) return res.status(404).json({ success: false, error: 'Not found.' });

            logsService.addLog({
                ...logActor(req),
                action:     'UPDATE',
                resource:   'password_entry',
                resourceId: id,
                details:    `Password entry updated: "${updated.serviceName}"`
            });
            res.json({ success: true, data: updated });
        } catch (err) { next(err); }
    }
);

router.delete('/:id',
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const id    = Number(req.params.id);
            const entry = await passwordsService.getById(id);
            await passwordsService.remove(id);

            logsService.addLog({
                ...logActor(req),
                action:     'DELETE',
                resource:   'password_entry',
                resourceId: id,
                details:    entry ? `Password entry deleted: "${entry.serviceName}"` : `Password entry deleted (ID: ${id})`
            });
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

router.post('/:id/reveal',
    requireVaultAuth,
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const id      = Number(req.params.id);
            const entry   = await passwordsService.getById(id);
            const password = await passwordsService.revealPassword(id);
            if (password == null) return res.status(404).json({ success: false, error: 'Not found.' });

            logsService.addLog({
                ...logActor(req),
                action:     'REVEAL',
                resource:   'password_entry',
                resourceId: id,
                details:    entry ? `Password revealed for "${entry.serviceName}"` : `Password revealed (ID: ${id})`
            });
            res.json({ success: true, data: { password } });
        } catch (err) { next(err); }
    }
);

module.exports = router;