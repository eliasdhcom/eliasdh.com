/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

class CostsService {
    async getAll() {
        const db = getDb();
        const { rows } = await db.execute('SELECT * FROM analysis_costs ORDER BY sort_order ASC, id ASC');
        return rows.map(r => this._map(r));
    }

    async getById(id) {
        const { rows } = await getDb().execute({ sql: 'SELECT * FROM analysis_costs WHERE id = ?', args: [id] });
        return rows.length ? this._map(rows[0]) : null;
    }

    async create(data) {
        const db = getDb();
        const { rows: [{ max }] } = await db.execute('SELECT COALESCE(MAX(sort_order), 0) AS max FROM analysis_costs');
        const sortOrder = Number(max) + 1;
        const res = await db.execute({
            sql:  'INSERT INTO analysis_costs (name, amount, frequency, type, sort_order) VALUES (?, ?, ?, ?, ?)',
            args: [
                data.name      ?? '',
                Number(data.amount ?? 0),
                data.frequency ?? 'yearly',
                data.type      ?? 'fixed',
                sortOrder
            ]
        });
        const id = Number(res.lastInsertRowid);
        logger.info(`Analysis cost created: ${id}`);
        return { id, name: data.name ?? '', amount: Number(data.amount ?? 0), frequency: data.frequency ?? 'yearly', type: data.type ?? 'fixed', sortOrder };
    }

    async update(id, data) {
        const db = getDb();
        const fields = [], args = [];
        if (data.name      !== undefined) { fields.push('name = ?');       args.push(data.name); }
        if (data.amount    !== undefined) { fields.push('amount = ?');     args.push(Number(data.amount)); }
        if (data.frequency !== undefined) { fields.push('frequency = ?');  args.push(data.frequency); }
        if (data.type      !== undefined) { fields.push('type = ?');       args.push(data.type); }
        if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); args.push(Number(data.sortOrder)); }
        if (!fields.length) throw new Error('No fields to update');
        args.push(id);
        await db.execute({ sql: `UPDATE analysis_costs SET ${fields.join(', ')} WHERE id = ?`, args });
        const { rows } = await db.execute({ sql: 'SELECT * FROM analysis_costs WHERE id = ?', args: [id] });
        if (!rows.length) throw new Error(`Cost ${id} not found`);
        logger.info(`Analysis cost updated: ${id}`);
        return this._map(rows[0]);
    }

    async delete(id) {
        await getDb().execute({ sql: 'DELETE FROM analysis_costs WHERE id = ?', args: [id] });
        logger.info(`Analysis cost deleted: ${id}`);
    }

    _map(r) {
        return {
            id:        Number(r.id),
            name:      r.name,
            amount:    Number(r.amount),
            frequency: r.frequency,
            type:      r.type,
            sortOrder: Number(r.sort_order)
        };
    }
}

module.exports = new CostsService();
