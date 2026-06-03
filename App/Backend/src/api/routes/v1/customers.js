/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express         = require('express');
const { body, param, validationResult } = require('express-validator');
const customerService = require('../../services/customers/customersService');
const { jwtAuth }     = require('../../../middleware/jwtAuth');
const logsService     = require('../../services/logs/logsService');
const mailerService   = require('../../services/mailer/mailerService');
const logger          = require('../../../utils/logger');
const router          = express.Router();

const logActor = req => ({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
    ipAddress: req.ip
});

router.get('/', async (req, res) => {
    try {
        const customers = await customerService.getAllCustomers();
        res.json({ success: true, data: customers, count: customers.length });
    } catch (err) {
        logger.error(`Error fetching customers: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        res.json({ success: true, data: customer });
    } catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});

router.post('/',
    jwtAuth,
    body('name').notEmpty().isString().trim(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const customer = await customerService.createCustomer(req.body);
            logsService.addLog({
                ...logActor(req),
                action:     'CREATE',
                resource:   'customer',
                resourceId: customer.id,
                details:    `Klant aangemaakt: ${customer.name} (ID: ${customer.id})`
            });
            res.status(201).json({ success: true, data: customer });
        } catch (err) {
            if (err.message?.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'Een klant met dit ID bestaat al.' });
            next(err);
        }
    }
);

router.put('/:id',
    jwtAuth,
    param('id').notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const customer = await customerService.updateCustomer(req.params.id, req.body);
            const subsChanged = req.body.websites !== undefined || req.body.domains !== undefined;
            logsService.addLog({
                ...logActor(req),
                action:     'UPDATE',
                resource:   'customer',
                resourceId: req.params.id,
                details:    `Klant bijgewerkt: ${customer.name} (ID: ${req.params.id})${subsChanged ? ' — overeenkomst gereset' : ''}`
            });
            res.json({ success: true, data: customer });
        } catch (err) {
            next(err);
        }
    }
);

router.delete('/:id',
    jwtAuth,
    param('id').notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await customerService.deleteCustomer(req.params.id);
            logsService.addLog({
                ...logActor(req),
                action:     'DELETE',
                resource:   'customer',
                resourceId: req.params.id,
                details:    `Klant verwijderd (ID: ${req.params.id})`
            });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

router.post('/:id/agreement/sign',
    jwtAuth,
    param('id').notEmpty(),
    body('signature').notEmpty().isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const customer = await customerService.getCustomerById(req.params.id);
            if (!customer) return res.status(404).json({ success: false, error: 'Klant niet gevonden.' });

            const result = await customerService.signAgreement(req.params.id, req.body.signature);

            if (customer.email) {
                const contactName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
                mailerService.sendAgreementEmail(customer.email, customer.name, contactName, customer, req.body.signature, result.signedAt)
                    .catch(err => logger.warn(`Agreement email failed for ${req.params.id}: ${err.message}`));
            }

            logsService.addLog({
                ...logActor(req),
                action:     'CREATE',
                resource:   'agreement',
                resourceId: req.params.id,
                details:    `Overeenkomst ondertekend: ${customer.name}`
            });

            res.json({ success: true, signedAt: result.signedAt });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;