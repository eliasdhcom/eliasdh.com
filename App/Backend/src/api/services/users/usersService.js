/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const bcrypt  = require('bcryptjs');
const { getDb } = require('../../../database/db');

function mapUser(r) {
    return {
        id:         Number(r.id),
        email:      r.email        ?? '',
        firstName:  r.first_name   ?? '',
        lastName:   r.last_name    ?? '',
        role:       r.role         ?? 'user',
        company:    r.company      ?? '',
        phone:      r.phone        ?? '',
        birthDate:  r.birth_date   ?? '',
        avatar:     r.avatar       ?? null,
        createdAt:  r.created_at   ?? '',
        active:     Number(r.active) === 1,
        netSalary:  Number(r.net_salary ?? 0),
        customerId: r.customer_id  ?? null
    };
}

async function getAllUsers() {
    const { rows } = await getDb().execute(
        'SELECT id, email, first_name, last_name, role, company, phone, birth_date, avatar, created_at, active, net_salary, customer_id FROM users ORDER BY id ASC'
    );
    return rows.map(mapUser);
}

async function getUsersByCustomer(customerId) {
    const { rows } = await getDb().execute({
        sql:  'SELECT id, email, first_name, last_name, role, company, phone, birth_date, avatar, created_at, active, net_salary, customer_id FROM users WHERE customer_id = ? ORDER BY id ASC',
        args: [customerId]
    });
    return rows.map(mapUser);
}

async function getUserById(id) {
    const { rows } = await getDb().execute({
        sql:  'SELECT id, email, first_name, last_name, role, company, phone, birth_date, avatar, created_at, active, net_salary, customer_id FROM users WHERE id = ?',
        args: [Number(id)]
    });
    return rows.length ? mapUser(rows[0]) : null;
}

async function setActive(id, active) {
    await getDb().execute({
        sql:  'UPDATE users SET active = ? WHERE id = ?',
        args: [active ? 1 : 0, Number(id)]
    });
}

async function updateUser(id, data) {
    const fields = [];
    const args   = [];
    if (data.firstName !== undefined) { fields.push('first_name = ?'); args.push(data.firstName); }
    if (data.lastName  !== undefined) { fields.push('last_name = ?');  args.push(data.lastName);  }
    if (data.email     !== undefined) { fields.push('email = ?');      args.push(data.email);     }
    if (data.role      !== undefined) { fields.push('role = ?');       args.push(data.role);      }
    if (data.company   !== undefined) { fields.push('company = ?');    args.push(data.company);   }
    if (data.phone     !== undefined) { fields.push('phone = ?');      args.push(data.phone);     }
    if (data.birthDate !== undefined) { fields.push('birth_date = ?'); args.push(data.birthDate); }
    if (data.avatar    !== undefined) { fields.push('avatar = ?');     args.push(data.avatar);    }
    if (data.netSalary !== undefined) { fields.push('net_salary = ?'); args.push(Number(data.netSalary)); }
    if (data.customerId !== undefined) { fields.push('customer_id = ?'); args.push(data.customerId); }
    if (!fields.length) return;
    args.push(Number(id));
    await getDb().execute({ sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`, args });
}

async function createUser(data) {
    const hash   = await bcrypt.hash(data.password, 12);
    const result = await getDb().execute({
        sql:  `INSERT INTO users (email, password_hash, first_name, last_name, role, company, phone, birth_date, avatar, active, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        args: [
            data.email,       hash,
            data.firstName  ?? '',
            data.lastName   ?? '',
            data.role       ?? 'user',
            data.company    ?? '',
            data.phone      ?? '',
            data.birthDate  ?? '',
            data.avatar     ?? null,
            data.customerId ?? null
        ]
    });
    return Number(result.lastInsertRowid ?? 0);
}

async function deleteUser(id) {
    await getDb().execute({ sql: 'DELETE FROM users WHERE id = ?', args: [Number(id)] });
}

module.exports = { getAllUsers, getUsersByCustomer, getUserById, setActive, updateUser, createUser, deleteUser };