const joi = require('joi')
const password = joi.string().pattern(/^[\S]{6,12}$/).required().label('输入的密码不合法')
const cell_phone = joi.string().pattern(new RegExp('^1[0-9]{10}$')).required().label('手机号不合法')
const code = joi.number().min(4).required().label('验证码不合法')
exports.regphone_schema = {
  body: {
    password,
    cell_phone,
    code,
  }
}
exports.regphonecode_schema = {
  body: {
    cell_phone
  }
}
const email = joi.string().pattern(/^[0-9]+@qq.com$/).required().label('邮箱不合法')
exports.regemail_schema = {
  body: {
    email,
    cell_phone,
    password,
  }
}
exports.regemailverify_schema = {
  body: {
    email
  }
}
exports.emailverify_schema = {
  body: {
    email
  }
}
const account = joi.string().required()
exports.pwdlogin_schema = {
  body: {
    account,
    password
  }
}
exports.phonelogin_schema = {
  body: {
    cell_phone
  }
}
const openid = joi.string().required()
exports.wxlogin_schema = {
  body: {
    openid
  }
}
exports.wxbindcode_schema = {
  body: {
    cell_phone
  }
}
exports.wxbind_schema = {
  body: {
    cell_phone,
    code,
    openid,
  }
}
exports.phonecodelogin_schema = {
  body: {
    cell_phone,
    code
  }
}
exports.sendphonecode_schema = {
  body: {
    cell_phone
  }
}
exports.findpwd_schema = {
  body: {
    cell_phone,
    code,
    password
  }
}
exports.findpwdcode_schema = {
  body: {
    cell_phone
  }
}
exports.sendemailfindpwd_schema = {
    body: {
        email
    }
}

let onepwd = joi.string().pattern(/^[\S]{6,12}$/).required()
let towpwd = joi.string().valid(joi.ref('onepwd')).label('两次密码必须相同')
exports.emailfindpwd_schema = {
  body : {
      email,
      onepwd,
      towpwd
  }
}
