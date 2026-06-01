/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express          = require('express');
const { body, validationResult } = require('express-validator');
const invoicesService  = require('../../services/invoices/invoicesService');
const { jwtAuth }      = require('../../../middleware/jwtAuth');
const logsService      = require('../../services/logs/logsService');

const router = express.Router();

router.get('/status', async (req, res, next) => {
    try {
        const statuses = await invoicesService.getAllStatuses();
        res.json({ success: true, data: statuses });
    } catch (err) {
        next(err);
    }
});

router.patch('/status',
    jwtAuth,
    body('customerId').notEmpty(),
    body('subscriptionId').notEmpty(),
    body('periodStart').notEmpty(),
    body('invoiceType').isIn(['subscription', 'domain']),
    body('paid').isBoolean(),
    body('amount').optional({ nullable: true }).isFloat(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            await invoicesService.upsertStatus(req.body);
            logsService.addLog({
                userId:    req.user?.id,
                userEmail: req.user?.email,
                userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
                action:    'UPDATE',
                resourceId: `${req.body.customerId}/${req.body.subscriptionId}`,
                details:   `Invoice ${req.body.paid ? 'marked as paid' : 'marked as pending'}`,
                ipAddress: req.ip
            });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;