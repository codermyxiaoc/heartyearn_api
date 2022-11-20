const express = require('express')
const multer = require('multer')
const path = require('path')
const expressjoi =require('@escook/express-joi')

const router = express.Router()

// 图片传输配置
const storage = multer.diskStorage({
        destination: (req,file,cb) => {
                cb(null,path.join(__dirname,'../static/groupcover'))
        },
        filename: (req,file,cb) => {
                cb(null,file.fieldname + '-' + Date.now() + '.jpg')
        }
})
const upload = multer({storage})

//路由函数导入
const { creategroup_fun,
        } = require('../router_func/group')

//数据验证

const {
        creategroup_schema
} = require('../schema/group')

//路由注册

router.post('/creategroup',upload.single('avatar'),expressjoi(creategroup_schema),creategroup_fun)


module.exports = router
