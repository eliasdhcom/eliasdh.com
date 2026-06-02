/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb }        = require('../../../database/db');
const logger           = require('../../../utils/logger');
const invoicesService  = require('../invoices/invoicesService');

const VAT_RATE = 0.21;

// ── Billing helpers for invoice snapshotting ─────────────────────────────────

function getBillingPeriods(startDateStr, frequency, endDate) {
    const periods = [];
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) return periods;
    if (frequency === 'one-time') {
        const end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        if (startDate <= endDate) periods.push({ start: startDate, end });
        return periods;
    }
    let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= endDate) {
        const periodStart = new Date(cursor);
        let periodEnd;
        switch (frequency) {
            case 'monthly':
                periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
                cursor    = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
                break;
            case 'quarterly':
                periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 0);
                cursor    = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
                break;
            case 'yearly':
                periodEnd = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 0);
                cursor    = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1);
                break;
            default: return periods;
        }
        if (periodStart <= endDate) periods.push({ start: periodStart, end: periodEnd });
    }
    return periods;
}

function getPeriodAmount(payment, discount, frequency) {
    const m        = frequency === 'yearly' ? 12 : frequency === 'quarterly' ? 3 : 1;
    const subtotal = Math.max(0, Number(payment) - Number(discount));
    return parseFloat((subtotal * (1 + VAT_RATE) * m).toFixed(2));
}

async function snapshotWebsiteHistory(customerId, websiteRow) {
    if (!websiteRow.start_date || Number(websiteRow.payment) <= 0) return;
    if ((websiteRow.subscription_type ?? '').toLowerCase().includes('free')) return;

    const now          = new Date();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const periods      = getBillingPeriods(websiteRow.start_date, websiteRow.frequency, endOfLastMonth);
    const amount       = getPeriodAmount(websiteRow.payment, websiteRow.discount, websiteRow.frequency);

    const snapshots = periods.map(({ start }) => ({
        customerId,
        subscriptionId: websiteRow.id,
        periodStart:    start.toISOString(),
        invoiceType:    'subscription',
        amount,
        frequency:      websiteRow.frequency
    }));

    await invoicesService.snapshotPastPeriods(snapshots);
}

// ─────────────────────────────────────────────────────────────────────────────

function formatAddress(loc) {
    return `${loc.street} ${loc.number}, ${loc.postal_code} ${loc.city}, ${loc.country}`;
}

function inClause(n) {
    return Array(n).fill('?').join(', ');
}

async function getNextCustomerId(db) {
    const { rows: [row] } = await db.execute(
        `SELECT MAX(CAST(id AS INTEGER)) AS max FROM customers`
    );
    const max = row?.max != null ? Number(row.max) : -1;
    return String(max + 1).padStart(3, '0');
}

async function getNextWebsiteId(db) {
    const { rows: [row] } = await db.execute(
        `SELECT MAX(CAST(id AS INTEGER)) AS max FROM websites`
    );
    const max = row?.max != null ? Number(row.max) : -1;
    return String(max + 1).padStart(3, '0');
}

function mapLocation(loc, socialLinks) {
    return {
        id:         Number(loc.id),
        street:     loc.street,
        number:     loc.number,
        postalCode: loc.postal_code,
        city:       loc.city,
        country:    loc.country,
        vat:        loc.vat,
        latitude:   loc.latitude,
        longitude:  loc.longitude,
        socialLinks
    };
}

function mapWebsite(w) {
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
}

function mapDomain(d) {
    return {
        id:          Number(d.id),
        name:        d.name,
        renewalDate: d.renewal_date,
        annualPrice: Number(d.annual_price)
    };
}

function buildCustomer(row, locations, websites, domains) {
    const primaryLoc = locations[0] ?? null;
    const allSocialLinks = locations.flatMap(l => l.socialLinks ?? []);
    const uniqueSocialLinks = allSocialLinks.filter(
        (link, idx, arr) => arr.findIndex(l => l.url === link.url) === idx
    );
    return {
        id:                 row.id,
        name:               row.name,
        isHQ:               row.is_hq === 1 || row.is_hq === 1n,
        firstName:          row.first_name  ?? undefined,
        lastName:           row.last_name   ?? undefined,
        email:              row.email       ?? undefined,
        phone:              row.phone       ?? undefined,
        mobile:             row.mobile      ?? undefined,
        logo:               row.logo        ?? undefined,
        vat:                primaryLoc?.vat ?? null,
        address:            primaryLoc ? formatAddress(primaryLoc) : '',
        latitude:           primaryLoc?.latitude  ?? null,
        longitude:          primaryLoc?.longitude ?? null,
        socialLinks:        uniqueSocialLinks,
        locations,
        websites,
        domains,
        agreementSignedAt:  row.agreement_signed_at ?? null
    };
}

async function batchFetchForCustomers(db, customerIds) {
    if (!customerIds.length) return { locationsByCustomer: new Map(), websitesByCustomer: new Map(), domainsByCustomer: new Map() };

    const ph = inClause(customerIds.length);

    const [{ rows: locRows }, { rows: websiteRows }, { rows: domainRows }] = await Promise.all([
        db.execute({ sql: `SELECT * FROM customer_locations WHERE customer_id IN (${ph}) ORDER BY id`, args: customerIds }),
        db.execute({ sql: `SELECT * FROM websites           WHERE customer_id IN (${ph}) ORDER BY id`, args: customerIds }),
        db.execute({ sql: `SELECT * FROM domain_names       WHERE customer_id IN (${ph}) ORDER BY id`, args: customerIds }),
    ]);

    const locIds = locRows.map(l => Number(l.id));
    let socialRows = [];
    if (locIds.length) {
        const { rows } = await db.execute({
            sql:  `SELECT * FROM location_social_links WHERE location_id IN (${inClause(locIds.length)}) ORDER BY id`,
            args: locIds
        });
        socialRows = rows;
    }

    const socialsByLocId = new Map();
    for (const s of socialRows) {
        const lid = Number(s.location_id);
        if (!socialsByLocId.has(lid)) socialsByLocId.set(lid, []);
        socialsByLocId.get(lid).push({ type: s.type, url: s.url });
    }

    const locationsByCustomer = new Map();
    for (const loc of locRows) {
        const cid = loc.customer_id;
        if (!locationsByCustomer.has(cid)) locationsByCustomer.set(cid, []);
        locationsByCustomer.get(cid).push(mapLocation(loc, socialsByLocId.get(Number(loc.id)) ?? []));
    }

    const websitesByCustomer = new Map();
    for (const w of websiteRows) {
        const cid = w.customer_id;
        if (!websitesByCustomer.has(cid)) websitesByCustomer.set(cid, []);
        websitesByCustomer.get(cid).push(mapWebsite(w));
    }

    const domainsByCustomer = new Map();
    for (const d of domainRows) {
        const cid = d.customer_id;
        if (!domainsByCustomer.has(cid)) domainsByCustomer.set(cid, []);
        domainsByCustomer.get(cid).push(mapDomain(d));
    }

    return { locationsByCustomer, websitesByCustomer, domainsByCustomer };
}

async function fetchSingleCustomerData(db, customerId) {
    const [{ rows: locRows }, { rows: websiteRows }, { rows: domainRows }] = await Promise.all([
        db.execute({ sql: 'SELECT * FROM customer_locations WHERE customer_id = ? ORDER BY id', args: [customerId] }),
        db.execute({ sql: 'SELECT * FROM websites           WHERE customer_id = ? ORDER BY id', args: [customerId] }),
        db.execute({ sql: 'SELECT * FROM domain_names       WHERE customer_id = ? ORDER BY id', args: [customerId] }),
    ]);

    const locIds = locRows.map(l => Number(l.id));
    let socialRows = [];
    if (locIds.length) {
        const { rows } = await db.execute({
            sql:  `SELECT * FROM location_social_links WHERE location_id IN (${inClause(locIds.length)}) ORDER BY id`,
            args: locIds
        });
        socialRows = rows;
    }

    const socialsByLocId = new Map();
    for (const s of socialRows) {
        const lid = Number(s.location_id);
        if (!socialsByLocId.has(lid)) socialsByLocId.set(lid, []);
        socialsByLocId.get(lid).push({ type: s.type, url: s.url });
    }

    const locations = locRows.map(loc => mapLocation(loc, socialsByLocId.get(Number(loc.id)) ?? []));
    const websites  = websiteRows.map(mapWebsite);
    const domains   = domainRows.map(mapDomain);

    return { locations, websites, domains };
}

async function insertLocations(db, customerId, locations) {
    for (const loc of (locations ?? [])) {
        const locRes = await db.execute({
            sql:  `INSERT INTO customer_locations (customer_id, street, number, postal_code, city, country, vat, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            sql:  'INSERT INTO domain_names (customer_id, name, renewal_date, annual_price) VALUES (?, ?, ?, ?)',
            args: [customerId, d.name ?? '', d.renewalDate ?? '', Number(d.annualPrice ?? 0)]
        });
    }
}

async function insertWebsites(db, customerId, websites) {
    for (const w of (websites ?? [])) {
        const wId = w.id || await getNextWebsiteId(db);
        await db.execute({
            sql:  `INSERT OR IGNORE INTO websites (id, customer_id, name, url, subscription_type, is_live, start_date, frequency, payment, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        if (!rows.length) return [];

        const ids = rows.map(r => r.id);
        const { locationsByCustomer, websitesByCustomer, domainsByCustomer } =
            await batchFetchForCustomers(db, ids);

        return rows.map(row => buildCustomer(
            row,
            locationsByCustomer.get(row.id)  ?? [],
            websitesByCustomer.get(row.id)   ?? [],
            domainsByCustomer.get(row.id)    ?? []
        ));
    }

    async getCustomerById(id) {
        const db = getDb();
        const { rows } = await db.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
        if (!rows.length) throw new Error(`Customer with ID ${id} not found`);

        const { locations, websites, domains } = await fetchSingleCustomerData(db, id);
        return buildCustomer(rows[0], locations, websites, domains);
    }

    async createCustomer(data) {
        const db = getDb();
        const id = data.id || await getNextCustomerId(db);
        await db.execute({
            sql:  `INSERT INTO customers (id, name, is_hq, first_name, last_name, email, phone, mobile, logo) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`,
            args: [id, data.name, data.firstName ?? null, data.lastName ?? null, data.email ?? null, data.phone ?? null, data.mobile ?? null, data.logo ?? null]
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
            // Fetch current websites to snapshot billing history before changes take effect
            const { rows: currentRows } = await db.execute({
                sql: 'SELECT * FROM websites WHERE customer_id = ? ORDER BY id', args: [id]
            });
            const currentById = new Map(currentRows.map(w => [w.id, w]));

            for (const newW of (data.websites ?? [])) {
                if (!newW.id) continue;
                const oldW = currentById.get(newW.id);
                if (!oldW) continue;

                const billingChanged =
                    Number(oldW.payment)  !== Number(newW.payment  ?? 0) ||
                    Number(oldW.discount) !== Number(newW.discount ?? 0) ||
                    oldW.frequency !== (newW.frequency ?? oldW.frequency);

                if (billingChanged) {
                    await snapshotWebsiteHistory(id, oldW);
                    // If frequency changed, reset startDate to first day of current month
                    // so new billing structure doesn't overlap with historical snapshots
                    if (oldW.frequency !== (newW.frequency ?? oldW.frequency)) {
                        const now = new Date();
                        newW.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                    }
                }
            }

            await db.execute({ sql: 'DELETE FROM websites WHERE customer_id = ?', args: [id] });
            await insertWebsites(db, id, data.websites);
            // Reset agreement — subscription changed
            await db.execute({ sql: `UPDATE customers SET agreement_signed_at = NULL WHERE id = ?`, args: [id] });
            logger.info(`Agreement reset for customer ${id}: subscription changed`);
        }
        if (data.domains !== undefined) {
            await db.execute({ sql: 'DELETE FROM domain_names WHERE customer_id = ?', args: [id] });
            await insertDomains(db, id, data.domains);
            // Reset agreement — domain changed
            await db.execute({ sql: `UPDATE customers SET agreement_signed_at = NULL WHERE id = ?`, args: [id] });
            logger.info(`Agreement reset for customer ${id}: domain changed`);
        }
        logger.info(`Customer updated: ${id}`);
        return this.getCustomerById(id);
    }

    async deleteCustomer(id) {
        await getDb().execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] });
        logger.info(`Customer deleted: ${id}`);
    }

    async signAgreement(id) {
        const db = getDb();
        const signedAt = new Date().toISOString();
        await db.execute({
            sql:  `UPDATE customers SET agreement_signed_at = ? WHERE id = ?`,
            args: [signedAt, id]
        });
        logger.info(`Agreement signed for customer: ${id}`);
        return { signedAt };
    }
}

module.exports = new CustomersService();