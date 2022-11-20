const redis = require('redis')
const { promisify } = require("util");

const client = redis.createClient()

const getAsync = promisify(client.get).bind(client)

module.exports = {
    client,
    getAsync
}