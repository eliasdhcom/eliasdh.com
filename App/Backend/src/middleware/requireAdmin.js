/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

const requireAdmin = (req, res, next) => {
    if ((req.user?.role ?? '').toLowerCase() !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    next();
};

module.exports = { requireAdmin };