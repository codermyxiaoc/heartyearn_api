const config = require("../config/index.json")
const email_register_html = (email) => {
  return `<span>欢迎注册心想心向<a href="${config.baseurl}/page/${email}/login.html">点击注册</a></span>`
}
const email_findpwd_html = (email) => {
  return `<span>您正在找回密码操作<a href="${config.baseurl}/page/${email}/emailfindpwd.html">点击注册</a></span>`
}
const email_changebind_code = (code) => {
  return `您好，您正在进行邮箱更换绑定操作，切勿将验证码泄露于他人，2分钟内有效。验证码：${code}`
}
module.exports = {
  email_register_html,
  email_findpwd_html,
  email_changebind_code
}