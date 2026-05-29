/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

const logger = require('../../../utils/logger');

const mockCustomers = [
    {
        id: '000',
        name: 'EliasDH BV',
        isHQ: true,
        firstName: 'Thomas',
        lastName: 'Deweerdt',
        email: 'info@eliasdh.com',
        phone: '+32474110316',
        mobile: '+32474110316',
        vat: 'BE1034925266',
        logo: 'eliasdh-logo.png',
        websites: [
            { id: '000', name: 'EliasDH Website', url: 'https://eliasdh.com', subscriptionType: 'Free', isLive: true, startDate: '2026-01-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Hulgenrodestraat',
                number: '64',
                postalCode: '2150',
                city: 'Antwerpen',
                country: 'Belgium',
                vat: 'BE1034925266',
                latitude: 51.1915943,
                longitude: 4.4969435,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/eliasdhcom' },
                    { type: 'github',    url: 'https://github.com/eliasdhcom' },
                    { type: 'linkedin',  url: 'https://www.linkedin.com/company/eliasdh' },
                    { type: 'facebook',  url: 'https://www.facebook.com/eliasdhcom' }
                ]
            }
        ]
    },
    {
        id: '001',
        name: 'Zizis',
        isHQ: false,
        firstName: 'Anja',
        lastName: 'Oliviers',
        email: 'info@zizis.be',
        phone: '+3232908885',
        mobile: '+32477538692',
        vat: 'BE0000000000',
        logo: 'zizis-logo.png',
        websites: [
            { id: '001', name: 'Zizis Website', url: 'https://zizis.be', subscriptionType: 'Free', isLive: true, startDate: '2026-05-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Provinciesteenweg',
                number: '557',
                postalCode: '2530',
                city: 'Boechout',
                country: 'Belgium',
                vat: 'BE0000000000',
                latitude: 51.1579064,
                longitude: 4.5154518,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/hairfashionzizis' }
                ]
            }
        ]
    },
    {
        id: '002',
        name: 'Bistro Theo BV',
        isHQ: false,
        firstName: 'Bart',
        lastName: 'Schauwvlieghe',
        email: 'bistrotheo@telenet.be',
        phone: '+3232267919',
        mobile: '+32495502837',
        vat: 'BE0443920597',
        logo: 'bistrotheo-logo.png',
        websites: [
            { id: '002', name: 'Bistro Theo Website', url: 'https://bistrotheo.be', subscriptionType: 'Startup', isLive: true, startDate: '2026-05-01', frequency: 'monthly', discount: 0 }
        ],
        locations: [
            {
                street: 'Nationalestraat',
                number: '33',
                postalCode: '2000',
                city: 'Antwerpen',
                country: 'Belgium',
                vat: 'BE0443920597',
                latitude: 51.2169627,
                longitude: 4.3998624,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/bistrotheo/' },
                    { type: 'facebook',  url: 'https://www.facebook.com/bistrotheo' }
                ]
            }
        ]
    },
    {
        id: '003',
        name: 'Slagerij Decruyenaere BV',
        isHQ: false,
        firstName: 'Andreas',
        lastName: 'Decruyenaere',
        email: 'slagerijdecruyenaere@gmail.com',
        phone: '+3234499367',
        mobile: '+32473296840',
        vat: 'BE0441729882',
        logo: 'slagerijdecruyenaere-logo.png',
        websites: [
            { id: '003', name: 'Slagerij Decruyenaere Website', url: 'https://slagerijdecruyenaere.be', subscriptionType: 'Basic', isLive: true, startDate: '2026-06-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Antwerpsestraat',
                number: '19',
                postalCode: '2640',
                city: 'Mortsel',
                country: 'Belgium',
                vat: 'BE0441729882',
                latitude: 51.1710583,
                longitude: 4.4480734,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/slagerijdc' },
                    { type: 'facebook',  url: 'https://www.facebook.com/slagerijDC' }
                ]
            }
        ]
    },
    {
        id: '024',
        name: 'Ter Eiken',
        isHQ: false,
        firstName: 'Roel',
        lastName: 'De Cock',
        email: 'invoice@tereiken.be',
        phone: '+3234574247',
        mobile: '+32477816519',
        vat: 'BE0833830212',
        logo: 'tereiken-logo.png',
        websites: [
            { id: '024', name: 'Ter Eiken Website', url: 'https://tereiken.be', subscriptionType: 'ToDo', isLive: false, startDate: '2027-01-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Kattenbroek',
                number: '33',
                postalCode: '2650',
                city: 'Edegem',
                country: 'Belgium',
                vat: 'BE0833830212',
                latitude: 51.1508601,
                longitude: 4.4251688,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikensport' },
                    { type: 'facebook',  url: 'https://www.facebook.com/tereiken' }
                ]
            },
            {
                street: 'Olieslagerijstraat',
                number: '19',
                postalCode: '2530',
                city: 'Boechout',
                country: 'Belgium',
                vat: 'BE0451910825',
                latitude: 51.1803828,
                longitude: 4.5049921,
                socialLinks: []
            },
            {
                street: 'Huybergsebaan',
                number: '164',
                postalCode: '2910',
                city: 'Essen',
                country: 'Belgium',
                vat: 'BE0463353558',
                latitude: 51.4274217,
                longitude: 4.4309693,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikenessen' },
                    { type: 'facebook',  url: 'https://www.facebook.com/TereikenEssen' }
                ]
            },
            {
                street: 'Grote Steenweg',
                number: '304',
                postalCode: '9340',
                city: 'Lede',
                country: 'Belgium',
                vat: 'BE0833830212',
                latitude: 50.9544048,
                longitude: 3.9186899,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikenlede' },
                    { type: 'facebook',  url: 'https://www.facebook.com/profile.php?id=61570368526149' }
                ]
            }
        ]
    },
    {
        id: '025',
        name: 'Level Up',
        isHQ: false,
        firstName: 'Roel',
        lastName: 'De Cock',
        email: 'invoice@tereiken.be',
        phone: '+3234574247',
        mobile: '+32477816519',
        vat: 'BE0833830212',
        logo: 'levelup-logo.png',
        websites: [
            { id: '026', name: 'Level Up Website', url: 'https://levelup.be', subscriptionType: 'ToDo', isLive: false, startDate: '2027-01-01', frequency: 'yearly', discount: 0 },
            { id: '027', name: 'Level Up App', url: 'https://app.levelup.be', subscriptionType: 'Enterprise', isLive: true,  startDate: '2027-01-01', frequency: 'yearly',  discount: 0 }
        ],
        locations: [
            {
                street: 'Kattenbroek',
                number: '33',
                postalCode: '2650',
                city: 'Edegem',
                country: 'Belgium',
                vat: 'BE0833830212',
                latitude: 51.1507722,
                longitude: 4.4239241,
                socialLinks: [
                    { type: 'instagram', url: 'https://www.instagram.com/levelupedegem' },
                    { type: 'facebook',  url: 'https://www.facebook.com/levelupleisureandsports' }
                ]
            },
            {
                street: 'Grote Steenweg',
                number: '304',
                postalCode: '9340',
                city: 'Lede',
                country: 'Belgium',
                vat: 'BE0833830212',
                latitude: 50.9539187,
                longitude: 3.9194254,
                socialLinks: []
            }
        ]
    }
];

const SUBSCRIPTION_PRICES = {
    'Free':       0,
    'ToDo':       0,
    'Basic':      20,
    'Growth':     40,
    'Startup':    80,
    'Business':   160,
    'Enterprise': 320
};

const VAT_RATE = 0.21;

function getSubscriptionPayment(website) {
    const predefined = SUBSCRIPTION_PRICES[website.subscriptionType];
    return predefined !== undefined ? predefined : (website.payment ?? 0);
}

function formatAddress(location) {
    return `${location.street} ${location.number}, ${location.postalCode} ${location.city}, ${location.country}`;
}

function withBackwardCompat(customer) {
    const primaryLocation = customer.locations?.[0];
    const allSocialLinks = customer.locations?.flatMap(l => l.socialLinks ?? []) ?? [];
    const uniqueSocialLinks = allSocialLinks.filter(
        (link, idx, arr) => arr.findIndex(l => l.url === link.url) === idx
    );
    return {
        ...customer,
        websites: (customer.websites ?? []).map(w => {
            const payment = getSubscriptionPayment(w);
            const subtotal = Math.max(0, payment - (w.discount ?? 0));
            return {
                ...w,
                payment,
                subtotal,
                vat: parseFloat((subtotal * VAT_RATE).toFixed(2)),
                total: parseFloat((subtotal * (1 + VAT_RATE)).toFixed(2))
            };
        }),
        address: primaryLocation ? formatAddress(primaryLocation) : '',
        latitude: primaryLocation?.latitude ?? null,
        longitude: primaryLocation?.longitude ?? null,
        socialLinks: uniqueSocialLinks
    };
}

class CustomersService {
    async getAllCustomers() {
        try {
            logger.info('Fetching all customers');
            return mockCustomers.map(withBackwardCompat);
        } catch (error) {
            logger.error(`CustomersService getAllCustomers error: ${error.message}`);
            throw new Error(`Error fetching customers: ${error.message}`);
        }
    }

    async getCustomerById(id) {
        try {
            logger.info(`Fetching customer with ID: ${id}`);
            const customer = mockCustomers.find(c => c.id === id);
            if (!customer) throw new Error(`Customer with ID ${id} not found`);
            return withBackwardCompat(customer);
        } catch (error) {
            logger.error(`CustomersService getCustomerById error: ${error.message}`);
            throw new Error(`Error fetching customer: ${error.message}`);
        }
    }
}

module.exports = new CustomersService();
