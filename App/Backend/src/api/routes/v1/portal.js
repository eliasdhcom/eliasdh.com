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

const router = express.Router();

router.use(jwtAuth, requireCustomer);

router.get('/me', async (req, res, next) => {
    try {
        const [customer, allCustomers, allStatuses] = await Promise.all([
            customersService.getCustomerById(req.user.customerId),
            customersService.getAllCustomers(),
            invoicesService.getAllStatuses()
        ]);
        const invoices = invoiceBuilderService.buildInvoices(allCustomers, allStatuses)
            .filter(inv => inv.customerId === req.user.customerId);
        res.json({ success: true, data: { customer, invoices } });
    } catch (err) {
        if (err.message?.includes('not found')) {
            return res.status(404).json({ success: false, error: 'Customer not found.' });
        }
        next(err);
    }
});

module.exports = router;
