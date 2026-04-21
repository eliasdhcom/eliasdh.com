/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

const logger = require('../../../utils/logger');

const mockCustomers = [
    {
        id: '0',
        name: 'EliasDH BV HQ',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/eliasdhcom" },
            { type: "github", url: "https://github.com/eliasdhcom" },
            { type: "linkedin", url: "https://www.linkedin.com/company/eliasdh" },
            { type: "facebook", url: "https://www.facebook.com/eliasdhcom" }
        ],
        address: 'Hulgenrodestraat 64, 2150 Antwerpen, Belgium',
        vat: 'BE1034925266',
        logo: 'eliasdh-logo.png',
        websites: [
            { subscriptionType: 'Free', url: 'https://eliasdh.com', name: 'EliasDH Website' }
        ],
        latitude: 51.1915943,
        longitude: 4.4969435,
        isHQ: true
    },
    {
        id: '1',
        name: 'Ter Eiken Edegem',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/tereikensport" },
            { type: "facebook", url: "https://www.facebook.com/tereiken" }
        ],
        address: 'Kattenbroek 33, 2650 Edegem, Belgium',
        vat: 'BE0833830212',
        logo: 'tereiken-logo.png',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' }
        ],
        latitude: 51.1508601,
        longitude: 4.4251688
    },
    {
        id: '2',
        name: 'Level Up Edegem',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/levelupedegem" },
            { type: "facebook", url: "https://www.facebook.com/levelupleisureandsports" }
        ],
        address: 'Kattenbroek 33, 2650 Edegem, Belgium',
        vat: 'BE0833830212',
        logo: 'levelup-logo.png',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://levelup.be', name: 'Level Up Website' },
            { subscriptionType: 'Enterprise', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 51.1507722,
        longitude: 4.4239241
    },
    {
        id: '3',
        name: 'Ter Eiken Boechout',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/tereikensport" },
            { type: "facebook", url: "https://www.facebook.com/tereiken" }
        ],
        address: 'Olieslagerijstraat 19, 2530 Boechout, Belgium',
        vat: 'BE0451910825',
        logo: 'tereiken-logo.png',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' }
        ],
        latitude: 51.1803828,
        longitude: 4.5049921
    },
    {
        id: '4',
        name: 'Ter Eiken Essen',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/tereikenessen" },
            { type: "facebook", url: "https://www.facebook.com/TereikenEssen" }
        ],
        address: 'Huybergsebaan 164, 2910 Essen, Belgium',
        vat: 'BE0463353558',
        logo: 'tereiken-logo.png',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' }
        ],
        latitude: 51.4274217,
        longitude: 4.4309693
    },
    {
        id: '5',
        name: 'Ter Eiken Lede',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/tereikenlede" },
            { type: "facebook", url: "https://www.facebook.com/profile.php?id=61570368526149" }
        ],
        address: 'Grote Steenweg 304, 9340 Lede, Belgium',
        vat: 'BE0833830212',
        logo: 'tereiken-logo.png',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://tereiken.be', name: 'Ter Eiken Website' }
        ],
        latitude: 50.9544048,
        longitude: 3.9186899
    },
    {
        id: '6',
        name: 'Level Up Lede',
        socialLinks: [
        ],
        address: 'Grote Steenweg 304, 9340 Lede, Belgium',
        vat: 'BE0833830212',
        logo: 'levelup-logo.png',
        websites: [
            { subscriptionType: 'ToDo', url: 'https://levelup.be', name: 'Level Up Website' },
            { subscriptionType: 'Enterprise', url: 'https://display.levelup.be', name: 'Level Up Display App' }
        ],
        latitude: 50.9539187,
        longitude: 3.9194254
    },
    {
        id: '7',
        name: 'Bistro Theo',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/bistrotheo/" },
            { type: "facebook", url: "https://www.facebook.com/bistrotheo" }
        ],
        address: 'Nationalestraat 33, 2000 Antwerpen, Belgium',
        vat: 'BE0443920597',
        logo: 'bistrotheo-logo.png',
        websites: [
            { subscriptionType: 'Startup', url: 'https://bistrotheo.be', name: 'Bistro Theo Website' }
        ],
        latitude: 51.2169627,
        longitude: 4.3998624
    },
    {
        id: '8',
        name: 'Zizis',
        socialLinks: [
            { type: "instagram", url: "https://www.instagram.com/hairfashionzizis" },
        ],
        address: 'Provinciesteenweg 557, 2530 Boechout, Belgium',
        vat: 'BE0000000000',
        logo: 'zizis-logo.png',
        websites: [
            { subscriptionType: 'Basic', url: 'https://zizis.be', name: 'Zizis Website' }
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