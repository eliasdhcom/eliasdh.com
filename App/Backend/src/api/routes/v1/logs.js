/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express     = require('express');
const { body, validationResult } = require('express-validator');
const { jwtAuth } = require('../../../middleware/jwtAuth');
const logsService = require('../../services/logs/logsService');
const logger      = require('../../../utils/logger');

const router = express.Router();

router.use(jwtAuth);

const ALLOWED_CLIENT_ACTIONS = ['DOWNLOAD', 'LOGOUT', 'CREATE'];

router.get('/', async (req, res, next) => {
    try {
        if ((req.user?.role ?? '').toLowerCase() !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied.' });
        }
        const { action, resource, userId, search, dateFrom, dateTo, limit, offset } = req.query;
        const result = await logsService.getLogs({ action, resource, userId, search, dateFrom, dateTo, limit, offset });
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

router.delete('/', async (req, res, next) => {
    try {
        if ((req.user?.role ?? '').toLowerCase() !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied.' });
        }
        await logsService.clearLogs();
        await logsService.addLog({
            userId:    req.user?.id,
            userEmail: req.user?.email,
            userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
            action:    'DELETE',
            resource:  'logs',
            details:   'All logs cleared',
            ipAddress: req.ip
        });
        logger.info(`[logs] All logs cleared by ${req.user?.email}`);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.post('/',
    body('action').notEmpty().isString().isIn(ALLOWED_CLIENT_ACTIONS),
    body('resource').optional({ nullable: true }).isString(),
    body('resourceId').optional({ nullable: true }).isString(),
    body('details').optional({ nullable: true }).isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            await logsService.addLog({
                userId:     req.user?.id,
                userEmail:  req.user?.email,
                userName:   `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
                action:     req.body.action,
                resource:   req.body.resource   ?? null,
                resourceId: req.body.resourceId ?? null,
                details:    req.body.details    ?? null,
                ipAddress:  req.ip
            });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;