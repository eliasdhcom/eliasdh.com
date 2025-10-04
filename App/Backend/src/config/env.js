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
        port: process.env.PORT || 3000,
        eliasdhAPIKey: process.env.ELIASDH_API_KEY,
        eliasdhAPIUrl: process.env.ELIASDH_API_URL || 'http://localhost:3000',
    },
};