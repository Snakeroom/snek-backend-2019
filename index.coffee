express = require "express"
session = require "express-session"
Grant = require "grant-express"
ws = require "uws"
PostgresStore = require("connect-pg-simple")(session)

config = require "./lib/config"
reddit = require "./lib/reddit"
db = require "./lib/database"

grantOpts =
    server:
        protocol: "http"
        host: config.host
        callback: "/auth/callback"
        transport: "querystring"
        state: true
    reddit:
        key: config.reddit.client_id
        secret: config.reddit.client_secret
        scope: ["identity"]
        custom_params:
            duration: "permanent"

grant = new Grant(grantOpts)
app = express()

app.set "view engine", "pug"

app.use "/static", express.static("#{__dirname}/static")
app.use session(
    secret: config.secret,
    resave: true,
    saveUninitialized: true
    store: new PostgresStore(pool: db.pool)
)
app.use grant

app.get "/auth/callback", (req, res) ->
    data = req.query
    req.session.user =
        access_token: data.access_token
        refresh_token: data.refresh_token
    
    # schedule database insert for signed in user
    process.nextTick ->
        re = new reddit.Client(data.access_token, data.refresh_token)
        re.getUserInfo().then (u) ->
            db.insertUser(u.id, u.name, data.access_token, data.refresh_token)
    
    res.redirect config.loggedInRedirect

app.use (req, res, next) ->
    if req.session.user
        req.reddit = new reddit.Client(req.session.user.access_token, req.session.user.refresh_token)
    next()

app.use "/admin", (req, res, next) ->
    unless req.session.user
        return res.redirect "/connect/reddit"
    
    req.reddit.getUserInfo().then (user) ->
        req.user = res.locals.user = user
        
        db.getUser(user.id).then (dbuser) ->
            if dbuser.admin
                next()
            else
                res.status(401).send "You're not an administrator!"
        .catch (err) ->
            next(err)
    .catch (err) ->
        next(err)

app.get "/admin/dash", (req, res) ->
    db.fastCount("users").then (n) ->
        stats =
            users: n
        
        res.render "admin.pug", stats: stats

app.get "/admin/dash/users", (req, res) ->
    db.getAllUsers().then (users) ->
        res.render "admin-users.pug", users: users

app.get "/admin/dash/circles", (req, res) ->
    res.render "admin-circles.pug"

app.delete "/admin/dash/users/:id", (req, res) ->
    db.deleteUser(req.params.id).then ->
        res.send success: true
    .catch (err) ->
        res.send success: false

app.get "/admin/info", (req, res, next) ->
    res.send req.user

app.use (err, req, res, next) ->
    unless res.locals.user
        res.locals.user = {name: "unknown"}
    
    res.render "error.pug", error: err

app.listen 4003
