got = require "got"
url = require "url"

config = require "./config"
basic = "#{config.reddit.client_id}:#{config.reddit.client_secret}"

buildUrl = (path, qs) ->
    urlData =
        protocol: "https"
        hostname: "oauth.reddit.com"
        pathname: path
        query: qs || {}
    url.format(urlData)

class RedditClient
    constructor: (@access_token, @refresh_token) ->
    
    refreshToken: (cb) ->
        payload =
            grant_type: "refresh_token"
            refresh_token: @refresh_token
        
        got.post("https://www.reddit.com/api/v1/access_token", form: payload, auth: basic, json: true).then (res) =>
            @access_token = res.body.access_token
            cb()
        .catch (err) ->
            console.error(err)
    
    makeAuthenticatedRequest: (method, path, qs, tries) ->
        tries = tries || 0
        localurl = buildUrl(path, qs)
        headers =
            "User-Agent": "server:com.sneknet.api:v0.1.0 (by /u/offbeatwitch)"
            "Authorization": "Bearer " + @access_token
        
        return new Promise (resolve, reject) ->
            got(localurl, method: method, json: true, headers: headers).then (res) =>
                resolve(res.body)
            .catch (err) ->
                tries++
                if err.statusCode == 403
                    if tries > 3
                        reject("Too many failed requests.")
                    @refreshToken(makeAuthenticatedRequest.bind(@, method, path, qs, tries))
                else
                    reject(err)
                
    
    getUserInfo: ->
        @makeAuthenticatedRequest("GET", "/api/v1/me")

module.exports =
    Client: RedditClient
