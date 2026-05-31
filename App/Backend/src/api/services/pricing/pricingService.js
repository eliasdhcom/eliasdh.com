/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

function mapPlan(r) {
    return {
        id:           Number(r.id),
        name:         r.name,
        monthlyPrice: Number(r.monthly_price),
        color:        r.color ?? '#cccccc'
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
            sql:  'INSERT INTO pricing_plans (name, monthly_price, color) VALUES (?, ?, ?)',
            args: [data.name.trim(), Number(data.monthlyPrice ?? 0), data.color ?? '#cccccc']
        });
        const id = Number(res.lastInsertRowid);
        logger.info(`Pricing plan created: ${data.name}`);
        return { id, name: data.name.trim(), monthlyPrice: Number(data.monthlyPrice ?? 0), color: data.color ?? '#cccccc' };
    }

    async update(id, data) {
        const db = getDb();
        const fields = [], args = [];
        if (data.name         !== undefined) { fields.push('name = ?');          args.push(data.name.trim()); }
        if (data.monthlyPrice !== undefined) { fields.push('monthly_price = ?'); args.push(Number(data.monthlyPrice)); }
        if (data.color        !== undefined) { fields.push('color = ?');         args.push(data.color); }
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
