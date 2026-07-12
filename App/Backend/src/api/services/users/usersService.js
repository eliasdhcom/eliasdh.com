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
        customerId: r.customer_id  ?? null,
        customerIds: []
    };
}

async function getCustomerIdsForUser(userId) {
    const { rows } = await getDb().execute({
        sql:  'SELECT customer_id FROM user_customers WHERE user_id = ? ORDER BY customer_id',
        args: [Number(userId)]
    });
    return rows.map(r => r.customer_id);
}

async function getCustomerIdsForUsers(userIds) {
    const map = new Map();
    if (!userIds.length) return map;
    const ph = userIds.map(() => '?').join(', ');
    const { rows } = await getDb().execute({
        sql:  `SELECT user_id, customer_id FROM user_customers WHERE user_id IN (${ph}) ORDER BY customer_id`,
        args: userIds
    });
    for (const r of rows) {
        const uid = Number(r.user_id);
        if (!map.has(uid)) map.set(uid, []);
        map.get(uid).push(r.customer_id);
    }
    return map;
}

async function setUserCustomers(userId, customerIds) {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM user_customers WHERE user_id = ?', args: [Number(userId)] });
    for (const cid of (customerIds ?? [])) {
        await db.execute({
            sql:  'INSERT OR IGNORE INTO user_customers (user_id, customer_id) VALUES (?, ?)',
            args: [Number(userId), cid]
        });
    }
}

async function attachCustomerIds(users) {
    const idsByUser = await getCustomerIdsForUsers(users.map(u => u.id));
    for (const u of users) u.customerIds = idsByUser.get(u.id) ?? [];
    return users;
}

async function getAllUsers() {
    const { rows } = await getDb().execute(
        'SELECT id, email, first_name, last_name, role, company, phone, birth_date, avatar, created_at, active, net_salary, customer_id FROM users ORDER BY id ASC'
    );
    return attachCustomerIds(rows.map(mapUser));
}

async function getUsersByCustomer(customerId) {
    const { rows } = await getDb().execute({
        sql:  `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.company, u.phone, u.birth_date,
                      u.avatar, u.created_at, u.active, u.net_salary, u.customer_id
               FROM users u
               JOIN user_customers uc ON uc.user_id = u.id
               WHERE uc.customer_id = ?
               ORDER BY u.id ASC`,
        args: [customerId]
    });
    return attachCustomerIds(rows.map(mapUser));
}

async function getUserById(id) {
    const { rows } = await getDb().execute({
        sql:  'SELECT id, email, first_name, last_name, role, company, phone, birth_date, avatar, created_at, active, net_salary, customer_id FROM users WHERE id = ?',
        args: [Number(id)]
    });
    if (!rows.length) return null;
    const user = mapUser(rows[0]);
    user.customerIds = await getCustomerIdsForUser(user.id);
    return user;
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
    if (data.customerIds !== undefined) { fields.push('customer_id = ?'); args.push(data.customerIds[0] ?? null); }
    if (fields.length) {
        args.push(Number(id));
        await getDb().execute({ sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`, args });
    }
    if (data.customerIds !== undefined) {
        await setUserCustomers(id, data.customerIds);
    }
}

async function createUser(data) {
    const hash        = await bcrypt.hash(data.password, 12);
    const customerIds = data.customerIds ?? (data.customerId ? [data.customerId] : []);
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
            customerIds[0]  ?? null
        ]
    });
    const id = Number(result.lastInsertRowid ?? 0);
    if (customerIds.length) await setUserCustomers(id, customerIds);
    return id;
}

async function deleteUser(id) {
    await getDb().execute({ sql: 'DELETE FROM users WHERE id = ?', args: [Number(id)] });
}

module.exports = {
    getAllUsers, getUsersByCustomer, getUserById, setActive, updateUser, createUser, deleteUser,
    getCustomerIdsForUser, getCustomerIdsForUsers, setUserCustomers
};