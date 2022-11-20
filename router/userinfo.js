const exporess = require('express')
const multer = require('multer')
const path = require('path')
const expressjoi = require('@escook/express-joi')

const router = exporess.Router()

// 图片传输配置
const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,path.join(__dirname,'../static/headpic'))
    },
    filename: (req,file,cb) => {
        cb(null,file.fieldname + '-' + Date.now() + '.jpg')
    }
})
const upload = multer({storage})
//路由函数引入
const { getuserinfo_func,
        alterheadpic_func,
        updateuserinfo_func,
        getfriendlist_func,
        changebindemail_func,
        snedchangebindemail_func,
        searchfriend_func,
        addfriend_func,
        newaddfriend_func,
        agreeOrrefuseaddfriend_func,
        isfriend_func,
        deletefriend_func,
        getfrienddetail_func} = require('../router_func/userinfo')
//验证引入
const { changebindemail_schemas,
        searchfriend_schemas,
        addfriend_schemas,
        agreeOrrefuseaddfriend_schemas,
        isfriend_schemas,
        deletefriend_schema} = require('../schema/userinfo')
//路由创建
router.get('/userinfo',getuserinfo_func)
router.post('/alterheadpic',upload.single('avatar'),alterheadpic_func)
router.post('/updateuserinfo', updateuserinfo_func)
router.get('/getfriendlist', getfriendlist_func)
router.post('/changebindemail',expressjoi(changebindemail_schemas), changebindemail_func)
router.post('/snedchangebindemail',snedchangebindemail_func)
router.post('/searchfriend',expressjoi(searchfriend_schemas),searchfriend_func)
router.post('/addfriend',expressjoi(addfriend_schemas),addfriend_func)
router.get('/newaddfriend',newaddfriend_func)
router.post('/agreeOrrefuseaddfriend',expressjoi(agreeOrrefuseaddfriend_schemas),agreeOrrefuseaddfriend_func)
router.post('/isfriend',expressjoi(isfriend_schemas),isfriend_func)
router.post('/deletefriend',expressjoi(deletefriend_schema),deletefriend_func)
router.post('/getfrienddetail',expressjoi(deletefriend_schema),getfrienddetail_func)
module.exports = router