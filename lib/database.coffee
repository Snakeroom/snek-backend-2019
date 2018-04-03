pg = require "pg"
moment = require "moment"
config = require "./config"

pool = new pg.Pool(config.db)

module.exports =
    pool: pool,
    insertUser: (id, username, access, refresh) ->
        pool.query("INSERT INTO users (id, username, access_token, refresh_token, date) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET access_token=$3, refresh_token=$4", [
            id, username, access, refresh, Date.now()
        ]).catch (err) ->
            console.error(err)
    getAllUsers: ->
        pool.query("SELECT * FROM users").then (res) ->
            res.rows.map (u) ->
                return id: u.id, name: u.username, date: moment(parseInt(u.date)).format("YYYY-MM-DD HH:mm"), admin: u.admin
    deleteUser: (id) ->
        pool.query("DELETE FROM users WHERE id=$1", [id])
