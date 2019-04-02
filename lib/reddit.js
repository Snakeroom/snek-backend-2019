const got = require("got");
const url = require("url");

const config = require("./config");
const basic = `${config.reddit.client_id}:${config.reddit.client_secret}`;
const useragent = "server:com.sneknet.api:v0.2.0 (by /u/offbeatwitch)";

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
    
    refreshToken() {
        const payload = {
            grant_type: "refresh_token",
            refresh_token: this.refresh_token
        };
        
        return got.post("https://www.reddit.com/api/v1/access_token", {form: true, body: payload, auth: basic, json: true}).then(res => {
            if (res.body.error)
                throw new Error("Reddit API error: " + res.body.error);

            this.access_token = res.body.access_token;
        });
    }
    
    makeAuthenticatedRequest(method, path, qs, tries) {
        tries = tries || 0;
        const localurl = buildUrl(path, qs);
        const headers = {
            "User-Agent": useragent,
            "Authorization": `Bearer ${this.access_token}`
        };
        
        return got(localurl, {method, json: true, headers})
            .then(res => res.body)
            .catch(err => {
                tries++;
    
                if (err.statusCode === 403) {
                    if (tries > 3)
                        throw new Error("Too many failed requests.");

                    return this.refreshToken().then(() =>
                        this.makeAuthenticatedRequest(method, path, qs, tries)
                    );
                } else {
                    throw err;
                }
            });
    }
                
    
    getUserInfo() {
        return this.makeAuthenticatedRequest("GET", "/api/v1/me");
    }
}

function getWebSocket() {
    const headers = {
        "User-Agent": useragent
    };
    
    return got.get("https://reddit.com/scene.json?raw_json=1", { headers, json: true }).then(res =>
        res.body.data.children[0].data.sequence_websocket_url
    );
}

function fetchPost(fullname) {
    return got.get(`https://reddit.com/by_id/${fullname}.json`, { headers: { "User-Agent": useragent }, json: true }).then(res =>
        res.body.data.children[0].data
    );
}

module.exports =
    {Client: RedditClient, getWebSocket, fetchPost};
