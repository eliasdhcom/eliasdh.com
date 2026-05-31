/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getDb, initSchema } = require('./db');

function logoToDataUrl(filename) {
    if (!filename) return null;
    const logoPath = path.join(__dirname, '../assets/logos', filename);
    if (!fs.existsSync(logoPath)) return null;
    const data = fs.readFileSync(logoPath);
    const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${data.toString('base64')}`;
}

const PRICING_PLANS = [
    { name: 'Free',       monthly_price: 0   },
    { name: 'Basic',      monthly_price: 20  },
    { name: 'Growth',     monthly_price: 40  },
    { name: 'Startup',    monthly_price: 80  },
    { name: 'Business',   monthly_price: 160 },
    { name: 'Enterprise', monthly_price: 320 },
];

const SUBSCRIPTION_PRICES = Object.fromEntries(PRICING_PLANS.map(p => [p.name, p.monthly_price]));

const CUSTOMERS = [
    {
        id: '000', name: 'EliasDH BV', is_hq: 1,
        first_name: 'Thomas', last_name: 'Deweerdt',
        email: 'info@eliasdh.com', phone: '+32474110316', mobile: '+32474110316',
        logo: 'eliasdh-logo.png',
        websites: [
            { id: '000', name: 'EliasDH Website', url: 'https://eliasdh.com', subscription_type: 'Free', is_live: 1, start_date: '2026-01-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Hulgenrodestraat', number: '64', postal_code: '2150', city: 'Antwerpen', country: 'Belgium',
                vat: 'BE1034925266', latitude: 51.1915943, longitude: 4.4969435,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/eliasdhcom' },
                    { type: 'github',    url: 'https://github.com/eliasdhcom' },
                    { type: 'linkedin',  url: 'https://www.linkedin.com/company/eliasdh' },
                    { type: 'facebook',  url: 'https://www.facebook.com/eliasdhcom' }
                ]
            }
        ]
    },
    {
        id: '001', name: 'Zizis', is_hq: 0,
        first_name: 'Anja', last_name: 'Oliviers',
        email: 'info@zizis.be', phone: '+3232908885', mobile: '+32477538692',
        logo: 'zizis-logo.png',
        websites: [
            { id: '001', name: 'Zizis Website', url: 'https://zizis.be', subscription_type: 'Free', is_live: 1, start_date: '2026-05-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Provinciesteenweg', number: '557', postal_code: '2530', city: 'Boechout', country: 'Belgium',
                vat: 'BE0000000000', latitude: 51.1579064, longitude: 4.5154518,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/hairfashionzizis' }
                ]
            }
        ]
    },
    {
        id: '002', name: 'Bistro Theo BV', is_hq: 0,
        first_name: 'Bart', last_name: 'Schauwvlieghe',
        email: 'bistrotheo@telenet.be', phone: '+3232267919', mobile: '+32495502837',
        logo: 'bistrotheo-logo.png',
        websites: [
            { id: '002', name: 'Bistro Theo Website', url: 'https://bistrotheo.be', subscription_type: 'Startup', is_live: 1, start_date: '2026-05-01', frequency: 'monthly', discount: 0 }
        ],
        locations: [
            {
                street: 'Nationalestraat', number: '33', postal_code: '2000', city: 'Antwerpen', country: 'Belgium',
                vat: 'BE0443920597', latitude: 51.2169627, longitude: 4.3998624,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/bistrotheo/' },
                    { type: 'facebook',  url: 'https://www.facebook.com/bistrotheo' }
                ]
            }
        ]
    },
    {
        id: '003', name: 'Slagerij Decruyenaere BV', is_hq: 0,
        first_name: 'Andreas', last_name: 'Decruyenaere',
        email: 'slagerijdecruyenaere@gmail.com', phone: '+3234499367', mobile: '+32473296840',
        logo: 'slagerijdecruyenaere-logo.png',
        websites: [
            { id: '003', name: 'Slagerij Decruyenaere Website', url: 'https://slagerijdecruyenaere.be', subscription_type: 'Basic', is_live: 1, start_date: '2026-06-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Antwerpsestraat', number: '19', postal_code: '2640', city: 'Mortsel', country: 'Belgium',
                vat: 'BE0441729882', latitude: 51.1710583, longitude: 4.4480734,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/slagerijdc' },
                    { type: 'facebook',  url: 'https://www.facebook.com/slagerijDC' }
                ]
            }
        ]
    },
    {
        id: '024', name: 'Ter Eiken Sport BV', is_hq: 0,
        first_name: 'Roel', last_name: 'De Cock',
        email: 'invoice@tereiken.be', phone: '+3234574247', mobile: '+32477816519',
        logo: 'tereiken-logo.png',
        websites: [
            { id: '024', name: 'Ter Eiken Website', url: 'https://tereiken.be', subscription_type: 'Free', is_live: 0, start_date: '2027-01-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Kattenbroek', number: '33', postal_code: '2650', city: 'Edegem', country: 'Belgium',
                vat: 'BE0833830212', latitude: 51.1508601, longitude: 4.4251688,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikensport' },
                    { type: 'facebook',  url: 'https://www.facebook.com/tereiken' }
                ]
            },
            {
                street: 'Olieslagerijstraat', number: '19', postal_code: '2530', city: 'Boechout', country: 'Belgium',
                vat: 'BE0451910825', latitude: 51.1803828, longitude: 4.5049921,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikensport' },
                    { type: 'facebook',  url: 'https://www.facebook.com/tereiken' }
                ]
            },
            {
                street: 'Huybergsebaan', number: '164', postal_code: '2910', city: 'Essen', country: 'Belgium',
                vat: 'BE0463353558', latitude: 51.4274217, longitude: 4.4309693,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikenessen' },
                    { type: 'facebook',  url: 'https://www.facebook.com/TereikenEssen' }
                ]
            },
            {
                street: 'Grote Steenweg', number: '304', postal_code: '9340', city: 'Lede', country: 'Belgium',
                vat: 'BE0833830212', latitude: 50.9544048, longitude: 3.9186899,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/tereikenlede' },
                    { type: 'facebook',  url: 'https://www.facebook.com/profile.php?id=61570368526149' }
                ]
            }
        ]
    },
    {
        id: '025', name: 'Level Up', is_hq: 0,
        first_name: 'Roel', last_name: 'De Cock',
        email: 'invoice@tereiken.be', phone: '+3234574247', mobile: '+32477816519',
        logo: 'levelup-logo.png',
        websites: [
            { id: '026', name: 'Level Up Website', url: 'https://levelup.be',      subscription_type: 'Free',       is_live: 0, start_date: '2027-01-01', frequency: 'yearly', discount: 0 },
            { id: '027', name: 'Level Up App',     url: 'https://app.levelup.be',  subscription_type: 'Enterprise', is_live: 1, start_date: '2027-01-01', frequency: 'yearly', discount: 0 }
        ],
        locations: [
            {
                street: 'Kattenbroek', number: '33', postal_code: '2650', city: 'Edegem', country: 'Belgium',
                vat: 'BE0833830212', latitude: 51.1507722, longitude: 4.4239241,
                social_links: [
                    { type: 'instagram', url: 'https://www.instagram.com/levelupedegem' },
                    { type: 'facebook',  url: 'https://www.facebook.com/levelupleisureandsports' }
                ]
            },
            {
                street: 'Grote Steenweg', number: '304', postal_code: '9340', city: 'Lede', country: 'Belgium',
                vat: 'BE0833830212', latitude: 50.9539187, longitude: 3.9194254,
                social_links: []
            }
        ]
    }
];

function loadBlogPosts() {
    const dataDir = path.join(__dirname, '../data');
    const posts   = [];
    for (const file of fs.readdirSync(dataDir)) {
        if (!file.endsWith('.json')) continue;
        try { posts.push(JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'))); }
        catch {}
    }
    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return posts;
}

async function seed() {
    await initSchema();
    const db = getDb();

    const { rows: [{ n: customerCount }] } = await db.execute('SELECT COUNT(*) AS n FROM customers');

    if (Number(customerCount) === 0) {
        for (const plan of PRICING_PLANS) {
            await db.execute({
                sql:  'INSERT OR IGNORE INTO pricing_plans (name, monthly_price) VALUES (?, ?)',
                args: [plan.name, plan.monthly_price]
            });
        }

        for (const c of CUSTOMERS) {
            await db.execute({
                sql:  'INSERT OR IGNORE INTO customers (id, name, is_hq, first_name, last_name, email, phone, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                args: [c.id, c.name, c.is_hq, c.first_name, c.last_name, c.email, c.phone, c.mobile]
            });

            for (const loc of c.locations) {
                const locResult = await db.execute({
                    sql:  'INSERT INTO customer_locations (customer_id, street, number, postal_code, city, country, vat, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    args: [c.id, loc.street, loc.number, loc.postal_code, loc.city, loc.country, loc.vat, loc.latitude, loc.longitude]
                });
                const locId = locResult.lastInsertRowid;
                for (const sl of (loc.social_links ?? [])) {
                    await db.execute({
                        sql:  'INSERT INTO location_social_links (location_id, type, url) VALUES (?, ?, ?)',
                        args: [locId, sl.type, sl.url]
                    });
                }
            }

            for (const w of c.websites) {
                const payment = SUBSCRIPTION_PRICES[w.subscription_type] ?? 0;
                await db.execute({
                    sql:  'INSERT INTO websites (id, customer_id, name, url, subscription_type, is_live, start_date, frequency, payment, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    args: [w.id, c.id, w.name, w.url, w.subscription_type, w.is_live, w.start_date, w.frequency, payment, w.discount ?? 0]
                });
            }
        }

        for (const post of loadBlogPosts()) {
            await db.execute({
                sql:  'INSERT OR IGNORE INTO blog_posts (slug, title, excerpt, content, author, published_at, reading_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
                args: [post.slug, post.title, post.excerpt ?? null, JSON.stringify(post.content), post.author ?? null, post.publishedAt ?? null, post.readingTime ?? null]
            });
        }
    }

    for (const c of CUSTOMERS) {
        const logoData = logoToDataUrl(c.logo);
        if (logoData) {
            await db.execute({
                sql:  'UPDATE customers SET logo = ? WHERE id = ? AND (logo IS NULL OR logo NOT LIKE \'data:%\')',
                args: [logoData, c.id]
            });
        }
    }

    const { rows: [{ n: costsCount }] } = await db.execute('SELECT COUNT(*) AS n FROM analysis_costs');
    if (Number(costsCount) === 0) {
        const initialCosts = [
            { name: 'KBC-Business Pro Zichtrekening', amount: 4.25,    frequency: 'monthly', type: 'fixed',    sort_order: 1 },
            { name: 'KBC-Business Pro Debetkaart',    amount: 0.75,    frequency: 'monthly', type: 'fixed',    sort_order: 2 },
            { name: 'Aansprakelijkheidsverzekering',  amount: 382.40,  frequency: 'yearly',  type: 'fixed',    sort_order: 3 },
            { name: 'Domain name (eliasdh.com)',      amount: 20.00,   frequency: 'yearly',  type: 'fixed',    sort_order: 4 },
            { name: 'Accountant',                     amount: 2200.00, frequency: 'yearly',  type: 'fixed',    sort_order: 5 },
            { name: 'Billit',                         amount: 25.00,   frequency: 'monthly', type: 'fixed',    sort_order: 6 },
        ];
        for (const c of initialCosts) {
            await db.execute({
                sql:  'INSERT INTO analysis_costs (name, amount, frequency, type, sort_order) VALUES (?, ?, ?, ?, ?)',
                args: [c.name, c.amount, c.frequency, c.type, c.sort_order]
            });
        }
        console.log('Analysis costs seeded.');
    }

    console.log('Seed complete.');
}

module.exports = { seedFn: seed };

if (require.main === module) {
    seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
}