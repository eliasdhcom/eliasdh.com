/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 30/06/2026
**/

const axios  = require('axios');
const logger = require('../../../utils/logger');

const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms';

class VatLookupService {
    async lookup(countryCode, vatNumber) {
        const cc  = String(countryCode ?? '').trim().toUpperCase();
        const vat = String(vatNumber   ?? '').replace(/[^0-9A-Za-z]/g, '').replace(new RegExp(`^${cc}`), '');
        if (!cc || !vat) return null;

        try {
            const { data } = await axios.get(`${VIES_URL}/${cc}/vat/${vat}`, { timeout: 8000 });
            if (!data?.isValid) return null;
            return { valid: true, name: data.name ?? '', address: data.address ?? '' };
        } catch (err) {
            logger.warn(`VAT lookup failed for ${cc}${vat}: ${err.message}`);
            return null;
        }
    }
}

module.exports = new VatLookupService();