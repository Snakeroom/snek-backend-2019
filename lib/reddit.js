const got = require("got");
const url = require("url");

const config = require("./config");
const basic = `${config.reddit.client_id}:${config.reddit.client_secret}`;

const buildUrl = function(path, qs) {
    const urlData = {
        protocol: "https",
        hostname: "oauth.reddit.com",
        pathname: path,
        query: qs || {}
    };
    return url.format(urlData);
};

class RedditClient {
    constructor(access_token, refresh_token) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }
    
    refreshToken(cb) {
        const payload = {
            grant_type: "refresh_token",
            refresh_token: this.refresh_token
        };
        
        return got.post("https://www.reddit.com/api/v1/access_token", {form: payload, auth: basic, json: true}).then(res => {
            this.access_token = res.body.access_token;
            return cb();
        }).catch(err => console.error(err));
    }
    
    makeAuthenticatedRequest(method, path, qs, tries) {
        tries = tries || 0;
        const localurl = buildUrl(path, qs);
        const headers = {
            "User-Agent": "server:com.sneknet.api:v0.2.0 (by /u/offbeatwitch)",
            "Authorization": `Bearer ${this.access_token}`
        };
        
        return new Promise(function(resolve, reject) {
            return got(localurl, {method, json: true, headers}).then(res => {
                return resolve(res.body);
        }).catch(function(err) {
                tries++;
                if (err.statusCode === 403) {
                    if (tries > 3) {
                        reject("Too many failed requests.");
                    }
                    return this.refreshToken(makeAuthenticatedRequest.bind(this, method, path, qs, tries));
                } else {
                    return reject(err);
                }
            });
        });
    }
                
    
    getUserInfo() {
        return this.makeAuthenticatedRequest("GET", "/api/v1/me");
    }
}

function getWebSocket() {
    const headers = {
        "User-Agent": "server:com.sneknet.api:v0.2.0 (by /u/offbeatwitch)"
    };
    
    return got.get("https://reddit.com/scene.json?raw_json=1", { headers, json: true }).then(res =>
        res.body.data.children[0].data.sequence_websocket_url
    );
}


module.exports =
    {Client: RedditClient, getWebSocket};
