/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const express = require("express");
const session = require("express-session");
const Grant = require("grant-express");
const ws = require("uws");
const PostgresStore = require("connect-pg-simple")(session);

const config = require("./lib/config");
const reddit = require("./lib/reddit");
const db = require("./lib/database");

const grantOpts = {
    server: {
        protocol: "http",
        host: config.host,
        callback: "/auth/callback",
        transport: "querystring",
        state: true
    },
    reddit: {
        key: config.reddit.client_id,
        secret: config.reddit.client_secret,
        scope: ["identity"],
        custom_params: {
            duration: "permanent"
        }
    }
};

const grant = new Grant(grantOpts);
const app = express();

app.set("view engine", "pug");

app.use("/static", express.static(`${__dirname}/static`));
app.use(session({
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
    store: new PostgresStore({pool: db.pool})
})
);
app.use(grant);

app.get("/auth/callback", function(req, res) {
    const data = req.query;
    req.session.user = {
        access_token: data.access_token,
        refresh_token: data.refresh_token
    };
    
    // schedule database insert for signed in user
    process.nextTick(function() {
        const re = new reddit.Client(data.access_token, data.refresh_token);
        return re.getUserInfo().then(u => db.insertUser(u.id, u.name, data.access_token, data.refresh_token));
    });
    
    return res.redirect(config.loggedInRedirect);
});

app.use(function(req, res, next) {
    if (req.session.user) {
        req.reddit = new reddit.Client(req.session.user.access_token, req.session.user.refresh_token);
    }
    return next();
});

app.use("/admin", function(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/connect/reddit");
    }
    
    return req.reddit.getUserInfo().then(function(user) {
        req.user = (res.locals.user = user);
        
        return db.getUser(user.id).then(function(dbuser) {
            if (dbuser.admin) {
                return next();
            } else {
                return res.status(401).send("You're not an administrator!");
            }}).catch(err => next(err));}).catch(err => next(err));
});

app.get("/admin/dash", (req, res) =>
    db.fastCount("users").then(function(n) {
        const stats =
            {users: n};
        
        return res.render("admin.pug", {stats});
    })
);

app.get("/admin/dash/users", (req, res) =>
    db.getAllUsers().then(users => res.render("admin-users.pug", {users}))
);

app.get("/admin/dash/circles", (req, res) => res.render("admin-circles.pug"));

app.delete("/admin/dash/users/:id", (req, res) =>
    db.deleteUser(req.params.id).then(() => res.send({success: true})).catch(err => res.send({success: false}))
);

app.get("/admin/info", (req, res, next) => res.send(req.user));

app.use(function(err, req, res, next) {
    if (!res.locals.user) {
        res.locals.user = {name: "unknown"};
    }
    
    return res.render("error.pug", {error: err});
});

app.listen(4003);
