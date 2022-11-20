const nodemailer = require('nodemailer')
const config = require('./config')

let transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: config.qq.user,
    pass: config.qq.pass
  }
})

exports.emailpage_verify = (email,title,content) => {
  let options = {
    from: '1964116717@qq.com',
    to: email,
    subject: title,
    html: content
  }
  return new Promise((resolve,resject) => {
    transporter.sendMail(options, (err, res) => {
      if (err) {
        resject(err)
      } else {
        resolve('OK')
      }
    })
  })
}
exports.emailcode_verify = (email, title, content) => {
  let options = {
    from: '1964116717@qq.com',
    to: email,
    subject: title,
    text: content
  }
  return new Promise((resolve, resject) =>{
    transporter.sendMail(options, (err, res) => {
      if (err) {
        resject(err)
      } else {
        resolve('OK')
      }
    })
  })
}