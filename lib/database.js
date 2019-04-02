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
    setUserAdmin(id, isAdmin) {
        return pool.query("UPDATE users SET admin=$2 WHERE id=$1", [id, isAdmin]);
    },
    deleteUser(id) {
        return pool.query("DELETE FROM users WHERE id=$1", [id]);
    },
    addSceneItem(sceneId, fullname) {
        return pool.query("INSERT INTO scenes (scene_id, fullname) VALUES ($1, $2) ON CONFLICT (scene_id) DO UPDATE SET fullname=$2", [
            sceneId, fullname
        ]);
    },
    getSceneItem(sceneId) {
        return pool.query("SELECT * FROM scenes WHERE scene_id=$1", [sceneId]).then(res => res.rows[0]);
    },
    getAllScenes() {
        return pool.query("SELECT * FROM scenes").then(res => res.rows);
    },
    deleteScene(sceneId) {
        return pool.query("DELETE FROM scenes WHERE scene_id=$1", [sceneId]);
    },
    recordScience(userhash, totalVotes) {
        return pool.query("INSERT INTO science (id, total_votes) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET total_votes=$2", [
            userhash, totalVotes
        ]);
    },
    fastCount(table) {
        return pool.query("select reltuples as row_count from pg_class where relname=$1", [table]).then(r => r.rows[0].row_count);
    }
};
