/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

const logger = require('../../../utils/logger');

const mockCustomers = [
    {
        id: '1',
        name: 'Ter Eiken Edegem',
        address: 'Kattenbroek 33, 2650 Edegem, Belgium',
        vat: 'BE0833830212',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' },
            { subscriptionType: 'ToDo', url: 'https://levelup.be', name: 'Level Up Website' },
            { subscriptionType: 'Enterprise', url: 'https://app.levelup.be', name: 'Level Up App' },
            { subscriptionType: 'Enterprise', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 51.150800,
        longitude: 4.424345
    },    
    {
        id: '2',
        name: 'Ter Eiken Boechout',
        address: 'Olieslagerijstraat 19, 2530 Boechout, Belgium',
        vat: 'BE0451910825',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' },
            { subscriptionType: 'ToDo', url: 'https://levelup.be', name: 'Level Up Website' },
            { subscriptionType: 'Enterprise', url: 'https://app.levelup.be', name: 'Level Up App' },
            { subscriptionType: 'Enterprise', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 51.1803828,
        longitude: 4.5049921
    },
    {
        id: '3',
        name: 'Ter Eiken Essen',
        address: 'Huybergsebaan 164, 2910 Essen, Belgium',
        vat: 'BE0463353558',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' },
            { subscriptionType: 'ToDo', url: 'https://levelup.be', name: 'Level Up Website' },
            { subscriptionType: 'Enterprise', url: 'https://app.levelup.be', name: 'Level Up App' },
            { subscriptionType: 'Enterprise', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 51.4274217,
        longitude: 4.4309693
    },
    {
        id: '4',
        name: 'Ter Eiken Lede',
        address: 'Grote Steenweg 304, 9340 Lede, Belgium',
        vat: 'BE0833830212',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' },
            { subscriptionType: 'ToDo', url: 'https://levelup.be', name: 'Level Up Website' },
            { subscriptionType: 'Enterprise', url: 'https://app.levelup.be', name: 'Level Up App' },
            { subscriptionType: 'Enterprise', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 50.9541437,
        longitude: 3.9190651
    },
    {
        id: '5',
        name: 'Zizis',
        address: 'Provinciesteenweg 557, 2530 Boechout, Belgium',
        vat: 'BE0000000000',
        websites: [
            { subscriptionType: 'Free', url: 'https://zizis.be', name: 'Zizis Website' }
        ],
        latitude: 51.1579064,
        longitude: 4.5154518
    },
    {
        id: '6',
        name: 'Bistro Theo',
        address: 'Nationalestraat 33, 2000 Antwerpen, Belgium',
        vat: 'BE0443920597',
        websites: [
            { subscriptionType: 'Startup', url: 'https://bistrotheo.be', name: 'Bistro Theo Website' }
        ],
        latitude: 51.2169627,
        longitude: 4.3998624
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