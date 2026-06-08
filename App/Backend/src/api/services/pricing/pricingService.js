/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

function parseJson(val, fallback) {
    try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function mapPlan(r) {
    return {
        id:           Number(r.id),
        name:         r.name,
        monthlyPrice: Number(r.monthly_price),
        color:        r.color ?? '#cccccc',
        isBestSeller: Boolean(r.is_bestseller),
        description:  typeof r.description === 'string' && r.description !== '{}' ? r.description : '',
        bullets:      parseJson(r.bullets, [])
    };
}

class PricingService {
    async getAll() {
        const { rows } = await getDb().execute('SELECT * FROM pricing_plans ORDER BY monthly_price ASC');
        return rows.map(mapPlan);
    }

    async create(data) {
        const db  = getDb();
        const res = await db.execute({
            sql:  'INSERT INTO pricing_plans (name, monthly_price, color, is_bestseller, description, bullets) VALUES (?, ?, ?, ?, ?, ?)',
            args: [
                data.name.trim(),
                Number(data.monthlyPrice ?? 0),
                data.color        ?? '#cccccc',
                data.isBestSeller ? 1 : 0,
                data.description ?? '',
                JSON.stringify(data.bullets ?? [])
            ]
        });
        const id = Number(res.lastInsertRowid);
        logger.info(`Pricing plan created: ${data.name}`);
        const { rows } = await db.execute({ sql: 'SELECT * FROM pricing_plans WHERE id = ?', args: [id] });
        return mapPlan(rows[0]);
    }

    async update(id, data) {
        const db = getDb();
        const fields = [], args = [];
        if (data.name         !== undefined) { fields.push('name = ?');           args.push(data.name.trim()); }
        if (data.monthlyPrice !== undefined) { fields.push('monthly_price = ?');  args.push(Number(data.monthlyPrice)); }
        if (data.color        !== undefined) { fields.push('color = ?');          args.push(data.color); }
        if (data.isBestSeller !== undefined) { fields.push('is_bestseller = ?');  args.push(data.isBestSeller ? 1 : 0); }
        if (data.description  !== undefined) { fields.push('description = ?');    args.push(data.description ?? ''); }
        if (data.bullets      !== undefined) { fields.push('bullets = ?');        args.push(JSON.stringify(data.bullets ?? [])); }
        if (!fields.length) throw new Error('No fields to update');
        args.push(id);
        await db.execute({ sql: `UPDATE pricing_plans SET ${fields.join(', ')} WHERE id = ?`, args });
        const { rows } = await db.execute({ sql: 'SELECT * FROM pricing_plans WHERE id = ?', args: [id] });
        if (!rows.length) throw new Error(`Pricing plan ${id} not found`);
        logger.info(`Pricing plan updated: ${id}`);
        return mapPlan(rows[0]);
    }

    async delete(id) {
        await getDb().execute({ sql: 'DELETE FROM pricing_plans WHERE id = ?', args: [id] });
        logger.info(`Pricing plan deleted: ${id}`);
    }
}

module.exports = new PricingService();
