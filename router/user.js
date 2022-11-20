//无token功能
const express = require('express')
const expressjoi = require('@escook/express-joi')

const router = express.Router()
//路由函数导入
const { regphone_func, 
        regphonecode_func, 
        regemailverify_func, 
        emailverify_func, 
        regemail_func ,
        pwdlogin_func,
        phonelogin_func,
        wxlogin_func,
        wxbindcode_func,
        wxbind_func,
        phonecodelogin_func,
        sendphonecode_func,
        findpwd_func,
        findpwdcode_func,
        sendemailfindpwd_func,
        emailfindpwd_func} = require('../router_func/user')

//数据验证导入
const { regphone_schema,
        regphonecode_schema, 
        regemailverify_schema, 
        emailverify_schema, 
        regemail_schema,
        pwdlogin_schema,
        phonelogin_schema,
        wxlogin_schema,
        wxbindcode_schema,
        wxbind_schema,
        phonecodelogin_schema,
        sendphonecode_schema,
        findpwd_schema,
        findpwdcode_schema,
        sendemailfindpwd_schema,
        emailfindpwd_schema} = require('../schema/user')
//路由注册
router.post('/regphone', expressjoi(regphone_schema),regphone_func)
router.post('/regphonecode', expressjoi(regphonecode_schema),regphonecode_func)
router.post('/regemail',expressjoi(regemail_schema),regemail_func)
router.post('/emailpageverify',expressjoi(regemailverify_schema),regemailverify_func)
router.post('/emailverify',expressjoi(emailverify_schema), emailverify_func)
router.post('/pwdlogin', expressjoi(pwdlogin_schema), pwdlogin_func)
router.post('/phonelogin',expressjoi(phonelogin_schema),phonelogin_func)
router.post('/wxlogin', expressjoi(wxlogin_schema),wxlogin_func)
router.post('/wxbindcode',expressjoi(wxbindcode_schema),wxbindcode_func)
router.post('/wxbind', expressjoi(wxbind_schema), wxbind_func)
router.post('/phonecodelogin',expressjoi(phonecodelogin_schema),phonecodelogin_func)
router.post('/sendphonecode',expressjoi(sendphonecode_schema),sendphonecode_func)
router.post('/findpwd',expressjoi(findpwd_schema),findpwd_func)
router.post('/findpwdcode',expressjoi(findpwdcode_schema),findpwdcode_func)
router.post('/sendemailfindpwd',expressjoi(sendemailfindpwd_schema),sendemailfindpwd_func)
router.post('/emailfindpwd',expressjoi(emailfindpwd_schema),emailfindpwd_func)
module.exports = router
