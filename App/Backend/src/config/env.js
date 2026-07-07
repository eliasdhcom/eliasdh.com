/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

module.exports = {
    server: {
        port:          process.env.PORT || 3000,
        eliasdhAPIKey: process.env.ELIASDH_API_KEY,
        jwtSecret:     process.env.JWT_SECRET     || 'fallback-secret-change-me',
        jwtExpiresIn:  process.env.JWT_EXPIRES_IN || '8h',
        vaultEncryptionKey: process.env.VAULT_ENCRYPTION_KEY,
    },
};