const joi = require('joi')
const email = joi.string().pattern(/^[0-9]+@qq.com$/).required().label('邮箱不合法')
const code = joi.number().min(4).required().label('验证码不合法')
const keyword = joi.string().required()
exports.changebindemail_schemas = {
    body: {
        email,
        code
    }
}
exports.searchfriend_schemas = {
    body: {
        keyword
    }
}
const friendID =joi.required()
const content = joi.string()
exports.addfriend_schemas = {
    body: {
        friendID,
        content
    }
}
const id = joi.required()
const friendtype = joi.required()
exports.agreeOrrefuseaddfriend_schemas = {
    body: {
        id,
        friendtype
    }
}
const friendid = joi.required()
exports.isfriend_schemas = {
    body: {
        friendid
    }
}
exports.deletefriend_schema = {
    body: {
        friendid
    }
}