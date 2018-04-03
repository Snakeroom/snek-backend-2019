fs = require "fs"
Hjson = require "hjson"

module.exports = Hjson.parse(fs.readFileSync("#{__dirname}/../config.hjson", "utf8"))
