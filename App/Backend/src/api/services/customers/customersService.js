/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

const VAT_RATE = 0.21;

function formatAddress(loc) {
    return `${loc.street} ${loc.number}, ${loc.postal_code} ${loc.city}, ${loc.country}`;
}

async function getNextCustomerId(db) {
    const { rows } = await db.execute('SELECT id FROM customers');
    const max = rows.reduce((m, r) => {
        const n = parseInt(r.id, 10);
        return isNaN(n) ? m : Math.max(m, n);
    }, -1);
    return String(max + 1).padStart(3, '0');
}

async function getNextWebsiteId(db) {
    const { rows } = await db.execute('SELECT id FROM websites');
    const max = rows.reduce((m, r) => {
        const n = parseInt(r.id, 10);
        return isNaN(n) ? m : Math.max(m, n);
    }, -1);
    return String(max + 1).padStart(3, '0');
}

async function fetchLocationsForCustomer(db, customerId) {
    const { rows: locs } = await db.execute({
        sql:  'SELECT * FROM customer_locations WHERE customer_id = ? ORDER BY id',
        args: [customerId]
    });
    const result = [];
    for (const loc of locs) {
        const { rows: socials } = await db.execute({
            sql:  'SELECT type, url FROM location_social_links WHERE location_id = ? ORDER BY id',
            args: [loc.id]
        });
        result.push({
            id:          Number(loc.id),
            street:      loc.street,
            number:      loc.number,
            postalCode:  loc.postal_code,
            city:        loc.city,
            country:     loc.country,
            vat:         loc.vat,
            latitude:    loc.latitude,
            longitude:   loc.longitude,
            socialLinks: socials.map(s => ({ type: s.type, url: s.url }))
        });
    }
    return result;
}

async function fetchWebsitesForCustomer(db, customerId) {
    const { rows } = await db.execute({
        sql:  'SELECT * FROM websites WHERE customer_id = ? ORDER BY id',
        args: [customerId]
    });
    return rows;
}

async function fetchDomainsForCustomer(db, customerId) {
    const { rows } = await db.execute({
        sql:  'SELECT * FROM domain_names WHERE customer_id = ? ORDER BY id',
        args: [customerId]
    });
    return rows.map(d => ({
        id:          Number(d.id),
        name:        d.name,
        renewalDate: d.renewal_date,
        annualPrice: Number(d.annual_price)
    }));
}

function buildCustomer(row, locations, websiteRows, domains) {
    const primaryLoc = locations[0] ?? null;
    const allSocialLinks = locations.flatMap(l => l.socialLinks ?? []);
    const uniqueSocialLinks = allSocialLinks.filter(
        (link, idx, arr) => arr.findIndex(l => l.url === link.url) === idx
    );
    const websites = websiteRows.map(w => {
        const subtotal = Math.max(0, Number(w.payment) - Number(w.discount));
        return {
            id:               w.id,
            name:             w.name,
            url:              w.url,
            subscriptionType: w.subscription_type,
            isLive:           w.is_live === 1 || w.is_live === 1n,
            startDate:        w.start_date,
            frequency:        w.frequency,
            payment:          Number(w.payment),
            discount:         Number(w.discount),
            subtotal:         parseFloat(subtotal.toFixed(2)),
            vat:              parseFloat((subtotal * VAT_RATE).toFixed(2)),
            total:            parseFloat((subtotal * (1 + VAT_RATE)).toFixed(2)),
            visitors:         Number(w.visitors ?? 0)
        };
    });
    return {
        id:          row.id,
        name:        row.name,
        isHQ:        row.is_hq === 1 || row.is_hq === 1n,
        firstName:   row.first_name ?? undefined,
        lastName:    row.last_name  ?? undefined,
        email:       row.email      ?? undefined,
        phone:       row.phone      ?? undefined,
        mobile:      row.mobile     ?? undefined,
        logo:        row.logo       ?? undefined,
        vat:         primaryLoc?.vat ?? null,
        address:     primaryLoc ? formatAddress(primaryLoc) : '',
        latitude:    primaryLoc?.latitude  ?? null,
        longitude:   primaryLoc?.longitude ?? null,
        socialLinks: uniqueSocialLinks,
        locations,
        websites,
        domains: domains ?? []
    };
}

async function insertLocations(db, customerId, locations) {
    for (const loc of (locations ?? [])) {
        const locRes = await db.execute({
            sql:  `INSERT INTO customer_locations
                       (customer_id, street, number, postal_code, city, country, vat, latitude, longitude)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                customerId,
                loc.street      ?? '',
                loc.number      ?? '',
                loc.postalCode  ?? '',
                loc.city        ?? '',
                loc.country     || 'Belgium',
                loc.vat         ?? null,
                loc.latitude    != null ? Number(loc.latitude)  : null,
                loc.longitude   != null ? Number(loc.longitude) : null
            ]
        });
        const locId = Number(locRes.lastInsertRowid ?? 0);
        for (const sl of (loc.socialLinks ?? [])) {
            if (!sl.url) continue;
            await db.execute({
                sql:  'INSERT INTO location_social_links (location_id, type, url) VALUES (?, ?, ?)',
                args: [locId, sl.type, sl.url]
            });
        }
    }
}

async function insertDomains(db, customerId, domains) {
    for (const d of (domains ?? [])) {
        await db.execute({
            sql:  `INSERT INTO domain_names (customer_id, name, renewal_date, annual_price) VALUES (?, ?, ?, ?)`,
            args: [customerId, d.name ?? '', d.renewalDate ?? '', Number(d.annualPrice ?? 0)]
        });
    }
}

async function insertWebsites(db, customerId, websites) {
    for (const w of (websites ?? [])) {
        const wId = w.id || await getNextWebsiteId(db);
        await db.execute({
            sql:  `INSERT OR IGNORE INTO websites
                       (id, customer_id, name, url, subscription_type, is_live, start_date, frequency, payment, discount)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                wId, customerId,
                w.name             ?? '',
                w.url              ?? '',
                w.subscriptionType ?? 'Free',
                w.isLive           ? 1 : 0,
                w.startDate        ?? null,
                w.frequency        ?? 'monthly',
                Number(w.payment   ?? 0),
                Number(w.discount  ?? 0)
            ]
        });
    }
}

class CustomersService {
    async getAllCustomers() {
        const db = getDb();
        const { rows } = await db.execute('SELECT * FROM customers ORDER BY id');
        const customers = [];
        for (const row of rows) {
            const locations = await fetchLocationsForCustomer(db, row.id);
            const websites  = await fetchWebsitesForCustomer(db, row.id);
            const domains   = await fetchDomainsForCustomer(db, row.id);
            customers.push(buildCustomer(row, locations, websites, domains));
        }
        return customers;
    }

    async getCustomerById(id) {
        const db = getDb();
        const { rows } = await db.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
        if (!rows.length) throw new Error(`Customer with ID ${id} not found`);
        const locations = await fetchLocationsForCustomer(db, id);
        const websites  = await fetchWebsitesForCustomer(db, id);
        const domains   = await fetchDomainsForCustomer(db, id);
        return buildCustomer(rows[0], locations, websites, domains);
    }

    async createCustomer(data) {
        const db  = getDb();
        const id  = data.id || await getNextCustomerId(db);
        await db.execute({
            sql:  `INSERT INTO customers (id, name, is_hq, first_name, last_name, email, phone, mobile, logo)
                   VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`,
            args: [id, data.name, data.firstName ?? null, data.lastName ?? null,
                   data.email ?? null, data.phone ?? null, data.mobile ?? null, data.logo ?? null]
        });
        await insertLocations(db, id, data.locations);
        await insertWebsites(db, id, data.websites);
        await insertDomains(db, id, data.domains);
        logger.info(`Customer created: ${id}`);
        return this.getCustomerById(id);
    }

    async updateCustomer(id, data) {
        const db = getDb();
        const fields = [], args = [];
        if (data.name      !== undefined) { fields.push('name = ?');       args.push(data.name); }
        if (data.firstName !== undefined) { fields.push('first_name = ?'); args.push(data.firstName); }
        if (data.lastName  !== undefined) { fields.push('last_name = ?');  args.push(data.lastName); }
        if (data.email     !== undefined) { fields.push('email = ?');      args.push(data.email); }
        if (data.phone     !== undefined) { fields.push('phone = ?');      args.push(data.phone); }
        if (data.mobile    !== undefined) { fields.push('mobile = ?');     args.push(data.mobile); }
        if (data.logo      !== undefined) { fields.push('logo = ?');       args.push(data.logo); }
        if (fields.length) {
            args.push(id);
            await db.execute({ sql: `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, args });
        }
        if (data.locations !== undefined) {
            await db.execute({ sql: 'DELETE FROM customer_locations WHERE customer_id = ?', args: [id] });
            await insertLocations(db, id, data.locations);
        }
        if (data.websites !== undefined) {
            await db.execute({ sql: 'DELETE FROM websites WHERE customer_id = ?', args: [id] });
            await insertWebsites(db, id, data.websites);
        }
        if (data.domains !== undefined) {
            await db.execute({ sql: 'DELETE FROM domain_names WHERE customer_id = ?', args: [id] });
            await insertDomains(db, id, data.domains);
        }
        logger.info(`Customer updated: ${id}`);
        return this.getCustomerById(id);
    }

    async deleteCustomer(id) {
        await getDb().execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] });
        logger.info(`Customer deleted: ${id}`);
    }
}

module.exports = new CustomersService();
