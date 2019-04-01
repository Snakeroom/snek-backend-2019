/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pg = require("pg");
const moment = require("moment");
const config = require("./config");

const pool = new pg.Pool(config.db);

module.exports = {
    pool,
    insertUser(id, username, access, refresh) {
        return pool.query("INSERT INTO users (id, username, access_token, refresh_token, date) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET access_token=$3, refresh_token=$4", [
            id, username, access, refresh, Date.now()
        ]).catch(err => console.error(err));
    },
    getAllUsers() {
        return pool.query("SELECT * FROM users").then(res =>
            res.rows.map(u => ({id: u.id, name: u.username, date: moment(parseInt(u.date)).format("YYYY-MM-DD HH:mm"), admin: u.admin}))
        );
    },
    getUser(id) {
        return pool.query("SELECT * FROM users WHERE id=$1", [id]).then(res => res.rows[0]);
    },
    deleteUser(id) {
        return pool.query("DELETE FROM users WHERE id=$1", [id]);
    },
    fastCount(table) {
        return pool.query("select reltuples as row_count from pg_class where relname=$1", [table]).then(r => r.rows[0].row_count);
    }
};
