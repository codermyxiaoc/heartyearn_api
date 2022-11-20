const dateFormat = require('../utils/dateFormat')
const config = require('../config/index.json')
const { db } = require('../mysql/index')
const {log} = require("util");

exports.creategroup_fun = (req,res) => {
    let groupinfo = {
        groupID: req.auth.id,
        createtime: dateFormat(new Date()),
        flockname: req.body.flockname,
        flockcover: `${config.baseurl}/groupcover/${req.file.filename}`,
        flocknotice: req.body.flocknotice || '欢迎加入' + req.body.flockname + '群聊'
    }
    let sqladd = 'insert into flock set ?'
    db.query(sqladd,groupinfo,(err,result) => {
        if(err) return res.cc(err)
        if(result.affectedRows !== 1 ) return res.cc('创建失败')
        res.send({
            status: 0,
            messgae: '创建成功'
        })
    })

}