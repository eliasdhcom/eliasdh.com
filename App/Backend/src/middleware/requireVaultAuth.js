/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

const vaultTokenStore = require('../api/services/vault/vaultTokenStore');

const requireVaultAuth = (req, res, next) => {
    const token = req.header('X-Vault-Token');
    if (!vaultTokenStore.check(token, req.user?.id)) {
        return res.status(401).json({ success: false, error: 'Vault locked. Please re-enter your password.' });
    }
    next();
};

module.exports = { requireVaultAuth };