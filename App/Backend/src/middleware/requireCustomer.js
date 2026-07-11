/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/07/2026
**/

const requireCustomer = (req, res, next) => {
    if ((req.user?.role ?? '').toLowerCase() !== 'customer' || !req.user?.customerId) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    next();
};

module.exports = { requireCustomer };