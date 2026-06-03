/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { verifyToken } = require('../api/services/auth/authService');

const jwtAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Not logged in.' });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, error: 'Session expired, please log in again.' });
    }
    req.user = payload;
    next();
};

module.exports = { jwtAuth };