const joi = require('joi')

const flockname = joi.string().required()
const flocknotice = joi.string()

exports.creategroup_schema = {
    body: {
        flockname,
        flocknotice
    }
}