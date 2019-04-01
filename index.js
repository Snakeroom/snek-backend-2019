const http = require("http");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const Grant = require("grant-express");
const ws = require("@clusterws/cws");
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
const server = http.createServer(app);
const wss = new ws.WebSocketServer({ server });

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

app.get("/v1/targets", (req, res) =>
    db.getAllScenes().then(scenes =>
        res.send({
            "targets": scenes.map(s => {
                let a = s.scene_id.split("_")
                return { chapter: parseInt(a[0]), scene: parseInt(a[1]), fullname: s.fullname };
            })
        })
    ).catch(err => res.send({ "error": "problem retrieving the scenes :(" }))
);

app.get("/auth/callback", function(req, res, next) {
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

    req.session.save((err) => {
        if (err) {
            return next(err);
        }
        
        return res.redirect(config.loggedInRedirect);
    })
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
            }
        }).catch(err => next(err));
    }).catch(err => res.redirect("/connect/reddit"));
});

app.get("/admin/dash", (req, res) =>
    db.fastCount("users").then(function(n) {
        const stats =
            {users: n};
        
        return res.render("admin.pug", {stats});
    })
);

app.get("/admin/dash/users", (req, res) =>
    db.getAllUsers().then(users => res.render("admin-users.pug", { users }))
);

app.get("/admin/dash/scenes", (req, res) =>
    db.getAllScenes().then(scenes => res.render("admin-circles.pug", { scenes }))
);

app.post("/admin/dash/scenes/:id", bodyParser.urlencoded(extended: false), (req, res, next) =>
    db.addSceneItem(req.body.sceneId, req.body.fullname)
        .then(() => {
            wss.broadcast(JSON.stringify({ "type": "new-scene", "fullname": req.body.fullname }));
            
            res.redirect("/admin/dash/scenes");
        }).catch(err => next(err))
);

app.get("/admin/dash/scenes/:id/delete", (req, res, next) =>
    db.deleteScene(req.params.id)
        .then(() => res.redirect("/admin/dash/scenes"))
        .catch(err => next(err))
);

app.get("/admin/dash/users/:id/make_admin", (req, res, next) =>
    db.setUserAdmin(req.params.id, true)
        .then(() => res.redirect("/admin/dash/users"))
        .catch(err => next(err))
);

app.get("/admin/dash/users/:id/delete", (req, res, next) =>
    db.deleteUser(req.params.id)
        .then(() => res.redirect("/admin/dash/users"))
        .catch(err => next(err))
);

app.get("/admin/dash/users/:id/revoke_admin", (req, res, next) =>
    db.setUserAdmin(req.params.id, false)
        .then(() => res.redirect("/admin/dash/users"))
        .catch(err => next(err))
);

app.get("/admin/info", (req, res, next) => res.send(req.user));

app.use(function(err, req, res, next) {
    if (!res.locals.user) {
        res.locals.user = {name: "unknown"};
    }
    
    return res.render("error.pug", {error: err});
});

function handleSocketMessage(msg) {
    if (msg.type == "science") {
        // todo: read params
    }
}

wss.on("connection", (socket) => {
    db.getAllScenes().then(scenes =>
        socket.send(
            JSON.stringify({ "type": "scenes", "fullnames": scenes.map(s => s.fullname) })
        )
    );

    socket.on("message", (data) =>
        handleSocketMessage(JSON.parse(data))
    );
});

server.listen(4003);
