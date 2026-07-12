/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/07/2026
**/

const express              = require('express');
const customersService     = require('../../services/customers/customersService');
const invoicesService      = require('../../services/invoices/invoicesService');
const invoiceBuilderService = require('../../services/invoices/invoiceBuilderService');
const { jwtAuth }          = require('../../../middleware/jwtAuth');
const { requireCustomer }  = require('../../../middleware/requireCustomer');
const { resolveSelectedCustomer } = require('../../../middleware/resolveSelectedCustomer');

const router = express.Router();

router.use(jwtAuth, requireCustomer);

router.get('/me', async (req, res, next) => {
    try {
        const customerId = resolveSelectedCustomer(req);
        if (!customerId) return res.status(403).json({ success: false, error: 'Access denied.' });

        const [customer, allCustomers, allStatuses] = await Promise.all([
            customersService.getCustomerById(customerId),
            customersService.getAllCustomers(),
            invoicesService.getAllStatuses()
        ]);
        const invoices = invoiceBuilderService.buildInvoices(allCustomers, allStatuses)
            .filter(inv => inv.customerId === customerId);
        res.json({ success: true, data: { customer, invoices } });
    } catch (err) {
        if (err.message?.includes('not found')) {
            return res.status(404).json({ success: false, error: 'Customer not found.' });
        }
        next(err);
    }
});

router.get('/companies', async (req, res, next) => {
    try {
        const allowed = new Set(req.user.customerIds ?? []);
        const all     = await customersService.getAllCustomers();
        const data    = all
            .filter(c => allowed.has(c.id))
            .map(c => ({ id: c.id, name: c.name, logo: c.logo ?? null }));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;