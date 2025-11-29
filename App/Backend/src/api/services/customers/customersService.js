/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

const logger = require('../../../utils/logger');

const mockCustomers = [
    {
        id: '1',
        name: 'Ter Eiken Sport',
        address: 'Kattenbroek 33, 2650 Edegem, Belgium',
        vat: 'BE0833830212',
        websites: [
            { subscriptionType: 'Professional', url: 'https://app.levelup.be', name: 'Level Up App' },
            { subscriptionType: 'Business', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 51.150800,
        longitude: 4.424345
    },
    {
        id: '2',
        name: 'Zizis',
        address: 'Provinciesteenweg 557, 2530 Boechout, Belgium',
        vat: 'BE0000000000',
        websites: [
            { subscriptionType: 'Free', url: 'https://www.zizis.be', name: 'Zizis Website' }
        ],
        latitude: 51.1579064,
        longitude: 4.5154518
    }
];

class CustomersService {
    async getAllCustomers() {
        try {
            logger.info('Fetching all customers');
            return mockCustomers;
        } catch (error) {
            logger.error(`CustomersService getAllCustomers error: ${error.message}`);
            throw new Error(`Error fetching customers: ${error.message}`);
        }
    }
}

module.exports = new CustomersService();