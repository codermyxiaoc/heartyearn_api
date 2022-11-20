const { db } = require('../mysql/index')
const {client, getAsync} = require('../redis/index')
const bcryptjs = require('bcryptjs')
const sendcode = require('../phone_code/index')
const dateFormat = require('../utils/dateFormat')
const { phone_creatcUser_template, phone_login_template, phone_forget_template,phone_wxbind_template } = require('../phone_code/code_template')
const { emailpage_verify } = require('../email_code/emailcode')
const { email_register_html, email_findpwd_html } = require('../email_code/template')
const randomuser = require('../utils/randomuser')
const jwt = require('jsonwebtoken')
const token_config = require('../token/config')
const randompwd = require('../utils/randompwd')
const e = require("express");
const {response} = require("express");
const {verify} = require("jsonwebtoken");

//手机号注册
exports.regphone_func = async (req,res) => {
  let info = req.body
  let code = await getAsync(info.cell_phone)
  if(!code) return res.cc('验证码过期')
  if(code != info.code) return res.cc('验证码错误')
  info.reg_time = dateFormat(new Date())
  info.password = bcryptjs.hashSync(info.password,10)
  info.username = randomuser(5) + '_' + randomuser(4)
  delete info.code
  let sqladd = 'insert into ev_users set ?'
  db.query(sqladd,info,(err,result) => {
    if(err) return res.cc(err)
    if(result.affectedRows !== 1) return res.cc('注册失败')
    client.del(info.cell_phone)
    res.send({
      status: 0,
      message: '注册成功'
    })
  })
}
//手机注册验证码
exports.regphonecode_func = (req,res) => {
  let phone = req.body.cell_phone
  let sqlfind = 'select cell_phone from ev_users where cell_phone = ?'
  db.query(sqlfind,phone,async (err,result) => {
    if(err) return res.cc(err)
    if(result.length > 0) return res.cc('手机号已被注册')
    let verCode = String(1000 + parseInt(Math.random() * 1000000)).substr(0, 4);
    try {
      let sendres = await sendcode(phone, verCode, phone_creatcUser_template)
      if (sendres.Code === 'OK') {
        let flag = client.set(phone,verCode)
        if(flag) {
          client.expire(phone,120)
          res.send({
            status: 0,
            message: '发送成功'
          })
        }
      }
    }catch (err) {
      res.cc(err)
    }
  })
}
//邮箱注册
exports.regemail_func = async (req,res) => {
  let info = req.body
  let verify_status = await getAsync(info.email)
  if(verify_status == null) return res.cc('验证过期') 
  if (verify_status == 'false') return res.cc('未验证')
  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind, info.cell_phone,(err,result) => {
    if(err) return res.cc(err)
    if(result.length > 0) return res.cc('手机号已被绑定')
    info.username = randomuser(5) + '_' + randomuser(4)
    info.password = bcryptjs.hashSync(info.password,10)
    info.reg_time = dateFormat(new Date())
    let sqladd = 'insert into ev_users set ?'
    db.query(sqladd,info,(err,result) => {
      if(err) return res.cc(err)
      if (result.affectedRows !== 1) return res.cc('注册失败')
      client.del(info.email)
      res.send({
        status: 0,
        message: '注册成功'
      })
    })
    
  })
  
}
//发送邮箱页面验证
exports.regemailverify_func = (req,res) => {
  let info = req.body
  let sqlfind = 'select * from ev_users where email = ?'
  db.query(sqlfind, info.email, async(err,result) => {
    if(err) return res.cc(err)
    if(result.length > 0) return res.cc('邮箱号已被绑定')
    let logintemplate = email_register_html(info.email)
   try {
     let verifyres = await emailpage_verify(info.email, '欢迎加入心想心向', logintemplate)
     if(verifyres === 'OK') {
       client.set(info.email,false)
       client.expire(info.email,300)
       res.send({
         status: 0,
         message: '以发送验证'
       })
     }
   }catch (err) {
     res.cc(err)
   }
  })
}
//邮箱页面验证
exports.emailverify_func = async(req,res) => {
  let body = req.body
  let verify_status = await getAsync(body.email)
  if(verify_status == null) return res.cc('验证失败') 
  if(verify_status == 'false') {
    client.set(body.email, true)
    client.expire(body.email, 300)
    res.send({
      status: 0,
      message: '验证成功'
    })
  } else {
    res.send({
      status: 0,
      message: '请回到注册页面点击注册'
    })
  }
}
//邮箱或手机号密码登入
exports.pwdlogin_func = (req,res) => {
  let { account, password } = req.body
  let regexp = /@/
  let regres = regexp.exec(account)
  let sqlfind = ''
  if (regres) {
    sqlfind = 'select * from ev_users where email = ?'
  } else {
    sqlfind = 'select * from ev_users where cell_phone = ?'
  }
  db.query(sqlfind,account,(err,result) => {
    if(err) return res.cc(err)
    if(result.length != 1) return res.cc('账号未注册') 
    if(!bcryptjs.compareSync(password, result[0].password)) return res.cc('密码错误')
    const user = {...result[0], password: '', status: ''}
    const tokenStr = jwt.sign(user, token_config.jwtSecretKey,{expiresIn: token_config.expiresIn})
    res.send({
      status: 0,
      message: '登入成功',
      token: 'Bearer ' + tokenStr
    })
  })
}
//手机号一键登入
exports.phonelogin_func = (req,res) => {
  let phone = req.body.cell_phone
  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind,phone,(err,result) => {
    if(err) return res.cc(err)
    let tokenStr = ''
    if(result.length !== 1) {
      const info = {}
      info.cell_phone = phone
      info.password = bcryptjs.hashSync(randompwd(6), 10)            
      info.username = randomuser(5) + '_' + randomuser(4)
      info.reg_time = dateFormat(new Date())
      let sqladd = 'insert into ev_users set ?'
      db.query(sqladd, info, (err, result) => {
        if (err) return res.cc(err)
        if (result.affectedRows !== 1) return res.cc('登入失败')
      })
    }
    const user = { ...result[0], password: '', status: '' }
    tokenStr = jwt.sign(user, token_config.jwtSecretKey, { expiresIn: token_config.expiresIn })
    res.send({
      status: 0,
      message: '登入成功',
      token: 'Bearer ' + tokenStr
    })
  })
}
//微信授权登入
exports.wxlogin_func = (req,res) => {
  let openid = req.body.openid
  let sqlfind = 'select * from ev_users where wx_openid = ?'
  db.query(sqlfind,openid,(err,result) => {
    if(err) return res.cc(err)
    if(result.length !== 1) return res.cc('未绑定手机号')
    const user = { ...result[0], password: '', status: '' }
    const tokenStr = jwt.sign(user, token_config.jwtSecretKey, { expiresIn: token_config.expiresIn })
    res.send({
      status: 0,
      message: '登入成功',
      token: 'Bearer ' + tokenStr
    })
  })
}
//绑定获取绑定微信验证码
exports.wxbindcode_func = (req,res) => {
  let phone = req.body.cell_phone
  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind,phone,async (err,result) => {
    if(err) return res.cc(err)
    if (result.length !== 0 && result[0].wx_openid) return res.cc('手机号已被绑定')
    try {
      let verCode = String(1000 + parseInt(Math.random() * 1000000)).substr(0, 4);
      let sendres = await sendcode(phone, verCode, phone_wxbind_template)
      if (sendres.Code === 'OK') {
        let phoneKey = 'wxbind' + phone
        let flag = client.set(phoneKey, verCode)
        if (flag) {
          client.expire(phoneKey, 120)
          res.send({
            status: 0,
            message: '发送成功'
          })
        }
      }
    }catch (err) {
      res.cc(err)
    }
  })
}
//微信绑定手机号
exports.wxbind_func = async(req,res) => {
  let info = req.body
  let phoneKey = 'wxbind' + info.cell_phone
  let code = await getAsync(phoneKey)
  if(!code) return res.cc('验证码过期')
  if(code != info.code) return res.cc('验证码错误')

  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind,info.cell_phone,(err,result) => {
    if(err) return res.cc(err)
    let user = {}
    let sqladdOrupdate = ''
    if(result.length == 0) {
      user = {
        id: null,
        cell_phone: info.cell_phone,
        password: bcryptjs.hashSync(randompwd(6), 10),        
        username: randomuser(5) + '_' + randomuser(4),
        wx_openid: info.openid,
        head_pic: info.avatarurl,
        reg_time: dateFormat(new Date())
      }
      sqladdOrupdate = 'insert into ev_users set ?'
    } else {
      user = {
        id: result[0].id,
        wx_openid: info.openid,
      }
      sqladdOrupdate = 'update ev_users set ? where id=?'
    }
    if(!user.id) {
      db.query(sqladdOrupdate,user,(err,result) => {
        if(err) return res.cc(err)
        if (result.affectedRows !== 1) return res.cc('绑定失败')
        let sqlfind = 'select * from ev_users where cell_phone = ?'
        db.query(sqlfind, info.cell_phone, (err, result) => {
          if (err) return res.cc(err)
          if (result.length !== 1) return res.cc('绑定失败')
          const user = { ...result[0], password: '', status: '' }
          const tokenStr = jwt.sign(user, token_config.jwtSecretKey, { expiresIn: token_config.expiresIn })
          client.del(phoneKey)
          res.send({
            status: 0,
            message: '登入成功',
            token: 'Bearer ' + tokenStr
          })
        })
      })
    } else {
      db.query(sqladdOrupdate, [{ wx_openid: user.wx_openid }, user.id],(err, result) => {
        if (err) return res.cc(err)
        if (result.affectedRows !== 1) return res.cc('绑定失败')
        let sqlfind = 'select * from ev_users where cell_phone = ?'
        db.query(sqlfind, info.cell_phone, (err, result) => {
          if (err) return res.cc(err)
          if (result.length !== 1) return res.cc('绑定失败')
          const user = { ...result[0], password: '', status: '' }
          const tokenStr = jwt.sign(user, token_config.jwtSecretKey, { expiresIn: token_config.expiresIn })
          client.del(phoneKey)
          res.send({
            status: 0,
            message: '登入成功',
            token: 'Bearer ' + tokenStr
          })
        })
      })
    }
  })
}
//手机号验证码登入
exports.phonecodelogin_func = async(req,res) => {
  let info = req.body
  let phonekey = 'login' + info.cell_phone
  const code = await getAsync(phonekey)
  if(!code) return res.cc('验证码过期')
  if(code != info.code) return res.cc('验证码错误')
  client.del(phonekey)
  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind, info.cell_phone,(err,result) => {
    if(err) return res.cc(err) 
    if(result.length !== 1) return res.cc('登入失败')
    const user = { ...result[0], password: '', status: '' }
    const tokenStr = jwt.sign(user, token_config.jwtSecretKey, { expiresIn: token_config.expiresIn })
    res.send({
      status: 0,
      message: '登入成功',
      token: 'Bearer ' + tokenStr
    })
  })
}
//手机登入获取验证码
exports.sendphonecode_func = (req,res) => {
  let phone = req.body.cell_phone
  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind,phone,async (err,result) => {
    if(err) return res.cc(err)
    if(result.length !== 1) return res.cc('手机号还未注册')
   try {
     let verCode = String(1000 + parseInt(Math.random() * 1000000)).substr(0, 4);
     let sendres = await sendcode(phone, verCode, phone_login_template)
     if (sendres.Code === 'OK') {
       let phoneKey = 'login' + phone
       let flag = client.set(phoneKey, verCode)
       if (flag) {
         client.expire(phoneKey, 120)
         res.send({
           status: 0,
           message: '发送成功'
         })
       }
     }
   }catch (err) {
       res.cc(err)
   }
  })
}
//手机号找回密码
exports.findpwd_func = async (req,res) => {
  let info = req.body
  let phonekey = 'findpwd' + info.cell_phone
  let code = await getAsync(phonekey)
  if(!code) return res.cc('验证码失效')
  if(code != info.code) return res.cc('验证码错误')
  let sqlupdate = 'update ev_users set ? where cell_phone = ? '
  let password = bcryptjs.hashSync(info.password,10)
  db.query(sqlupdate,[{password},info.cell_phone],(err,result) => {
    if(err) return res.cc(err)
    if(result.affectedRows !== 1) return res.cc('修改失败')
    client.del(phonekey)
    res.send({
      status: 0,
      message: '修改成功'
    })
  })
}
//找回密码验证码
exports.findpwdcode_func = (req,res) => {
  let cell_phone = req.body.cell_phone
  let sqlfind = 'select * from ev_users where cell_phone = ?'
  db.query(sqlfind,cell_phone, async (err,result) => {
    if(err) return res.cc(err)
    if(result.length !== 1) return res.cc('无此用户')
    try {
      let verCode = String(1000 + parseInt(Math.random() * 1000000)).substr(0, 4);
      let sendres = await sendcode(phone, verCode, phone_forget_template)
      if (sendres.Code === 'OK') {
        let phoneKey = 'findpwd' + cell_phone
        let flag = client.set(phoneKey, verCode)
        if (flag) {
          client.expire(phoneKey, 120)
          res.send({
            status: 0,
            message: '发送成功'
          })
        }
      }
    }catch (err) {
      res.cc(err)
    }
  })
}
//发送邮箱找回密码验证
exports.sendemailfindpwd_func = (req,res) => {
  let email = req.body.email;
  let sqlfind = 'select * from ev_users where email = ?'
  db.query(sqlfind,email, async (err,result) => {
    if(err) return res.cc(err)
    if(result.length != 1) return res.cc('无此用户')
    let findpwdtemplate = email_findpwd_html(email)
    try {
      let verifyres = await emailpage_verify(email, '找回密码', findpwdtemplate)
      if(verifyres === 'OK') {
        let emailkey = 'email' + email
        let flag = client.set(emailkey, 'true')
        if (flag) {
          client.expire(emailkey, 300)
          res.send({
            status: 0,
            message: '发送成功'
          })
        }
      }
    }catch (err) {
      res.cc(err)
    }
  })
}
//邮箱找回密码
exports.emailfindpwd_func = async (req,res) => {
  let info = req.body
  let emailkey = 'email' + info.email
  let verify = await getAsync(emailkey)
  if(!verify) return res.cc('验证过期')
  let password = bcryptjs.hashSync(info.onepwd,10)
  let sqlupdate = 'update ev_users set ? where email = ?'
  db.query(sqlupdate,[{password},info.email],(err,result) => {
    if(err) return res.cc(err)
    if(result.affectedRows !== 1) return res.cc('操作失败稍后再试')
    client.del(emailkey)
    res.send({
      status: 0,
      message: "修改成功"
    })
  })
}
