const { db, dbAsync } = require('../mysql/index')
const path = require('path')
const fs = require('fs')
const config = require('../config/index.json')
const { emailcode_verify } = require('../email_code/emailcode')
const { email_changebind_code } = require('../email_code/template')
const { client, getAsync} = require('../redis/index')
const {query} = require("express");
const dateFormat = require("../utils/dateFormat");
const {err_code} = require("redis/lib/utils");
//返回用户基本信息
exports.getuserinfo_func = (req,res) => {
  let userid = req.auth.id
  let sqlfind = 'select * from ev_users where id = ?'
  db.query(sqlfind,userid,(err,result) => {
    if(err) return res.cc(err)
    if(result.length != 1) return res.cc('无此用户')
    let userinfo = { ...result[0], password: '',wx_openid: ''}
    res.send({
      status: 0,
      message: '查找成功',
      data: userinfo
    })
  })
}
//修改头像
exports.alterheadpic_func = (req,res) => {
  let userid = req.auth.id
  let sqlfind = 'select * from ev_users where id = ?'
  db.query(sqlfind,userid,(err,result) => {
      if(err) return res.cc(err)
      if(result.length !== 1) return res.cc('修改失败')
      let oldpic = result[0].head_pic
      let basename = path.basename(oldpic)
      let newpic = `${config.baseurl}/headpic/${req.file.filename}`
      if('newuser.jpg' != basename) {
          let rmurl = path.join(__dirname,`../static/headpic/${basename}`)
          fs.rm(rmurl,{force: true},(err) => {
            if(err) return res.cc(err)
          })
      }
      let sqlupdate = 'update ev_users set ? where id = ?'
      db.query(sqlupdate,[{head_pic: newpic},userid],(err,result) => {
          if(err) return res.cc(err)
          if(result.affectedRows !== 1) return res.cc('修改失败')
          res.send({
              status: 0,
              message: '修改成功'
          })
      })
  })
}
//修改用户信息
exports.updateuserinfo_func = (req,res) => {
    let userinfo =req.body
    let userid = req.auth.id
    userinfo.email && delete userinfo.email
    userinfo.cell_phone && delete userinfo.cell_phone
    userinfo.reg_time && delete  userinfo.reg_time
    userinfo.head_pic && delete  userinfo.head_pic
    userinfo.status && delete  userinfo.status
    userinfo.wx_openid && delete  userinfo.wx_openid
    userinfo.password && delete  userinfo.password
    let sqlupdate = 'update ev_users set ? where id = ?'
    db.query(sqlupdate,[{...userinfo},userid],(err,result) => {
        if(err) return res.cc(err)
        if(result.affectedRows !== 1) return res.cc('修改失败')
        res.send({
            status: 0,
            message: '修改成功'
        })
    })
}
//获取好友列表
exports.getfriendlist_func = async (req,res) => {
    let userid = req.auth.id
    let sqlfind = 'select id,username,head_pic,signature,sex from ev_users where ev_users.id in (select t.friendID from ((select userID,friendID from friend WHERE (userID = ? OR friendID = ?) and friendstatus = 1) as t)) or ev_users.id in (select t.userID from ((select userID,friendID from friend WHERE (userID = ? OR friendID = ?) and friendstatus = 1) as t))'
    db.query(sqlfind,[userid,userid,userid,userid],(err,result) => {
        if(err) return res.cc(err)
        res.send({
            status: 0,
            message: '获取成功',
            data: result
        })
    })
}
//修改绑定邮箱
exports.changebindemail_func = (req,res) => {
    let data = req.body
    let userid = req.auth.id
    let sqlfid = 'select * from ev_users where email = ?'
    db.query(sqlfid,data.email,(err,result) => {
        if(err) return res.cc(err)
        if(result.length !== 0) return res.cc('邮箱号已被绑定')
        let sqlfid = 'select * from ev_users where id = ?'
        db.query(sqlfid, userid, async (err,result) => {
            if(err) res.cc(err)
            let emailkey = 'changebindemai' +  result[0].email
            let code = await getAsync(emailkey)
            if(!code) return res.cc('验证码过期')
            if(code != data.code) return res.cc('验证码错误')
            let sqlupdate = 'update ev_users set email = ? where id = ?'
            db.query(sqlupdate, [data.email,userid], async(err, result) => {
                if(err) return res.cc(err)
                if(result.affectedRows !== 1) return res.cc('更改失败')
                client.del(emailkey)
                res.send({
                    status: 0,
                    message: '更改成功'
                })
            })
        })
    })


}
//发送邮箱改绑验证码
exports.snedchangebindemail_func = (req, res) => {
    let userid = req.auth.id
    let sqlfind = 'select * from ev_users where id = ?'
    db.query(sqlfind, userid, async (err,result) =>{
        let email = result[0].email
        if(err) return res.cc(err)
        if(!email) return res.cc('还未绑定邮箱')
        let code = String(1000 + parseInt(Math.random() * 1000000)).substr(0, 4);
        let contexttemplate = email_changebind_code(code)
        let emailkey = 'changebindemai' + email
        let flag = client.set(emailkey,code)
        if(flag) {
            client.expire(emailkey, 120)
            let emailres = await emailcode_verify(email,'更换邮箱绑定验证码',contexttemplate)
            if(emailres == 'OK') {
                res.send({
                    status: 0,
                    message: '发送成功'
                })
            }
        }
    })
}
//搜索用户
exports.searchfriend_func = (req,res) => {
    let keyword = req.body.keyword
    let sqlfind = 'select id,username,signature,sex,head_pic from ev_users where  cell_phone = ? or username regexp ?'
    db.query(sqlfind,[keyword,keyword],(err,result) => {
        if(err) return res.cc(err)
        res.send({
            status: 0,
            message: '搜索成功',
            data: result
        })
    })
}
//判断是否为好友
exports.isfriend_func = async (req,res) =>{
    let friendid = req.body.friendid
    let id = req.auth.id
    let sqlfind = 'select * from friend where userID = ? and friendID = ? and friendstatus = 1'
    let res1 = await dbAsync(sqlfind,[friendid,id])
    let res2 = await dbAsync(sqlfind,[id,friendid])
    if(res1.length > 0 || res2.length > 0) {
        res.send({
            status: 0,
            message: '查询成功',
            data: {
                friendstatus: 1
            }
        })
    } else {
        res.send({
            status: 0,
            message: '查询成功',
            data: {
                friendstatus: 0
            }
        })
    }

}
//添加好友
exports.addfriend_func = async (req,res) => {
    let adddata = {
        userID: req.auth.id,
        friendID: req.body.friendID,
        content: req.body.content,
        createtime: dateFormat(new Date())
    }
    try {
        let sqlfind = 'select * from friend where userID = ? and friendID = ?'
        let result = await dbAsync(sqlfind,[adddata.friendID,adddata.userID])
        if(result.length != 0) {
            let sqlupdate = 'update friend set friendstatus = 1 where id = ?'
            let addres = await dbAsync(sqlupdate,result[0].id)
            if(addres.affectedRows !== 1) return res.cc('添加失败')
            return res.send({
                status: 0,
                message: '添加成功'
            })
        }
        result = await dbAsync(sqlfind,[adddata.userID,adddata.friendID])
        if(result.length !== 0) {
            let sqlupdate = 'update friend set content = ? where id = ?'
            let addres = await dbAsync(sqlupdate,[adddata.content,result[0].id])
            if(addres.affectedRows !== 1) return res.cc('添加失败')
            return res.send({
                status: 0,
                message: '添加成功'
            })
        } else {
            let sqladd = 'insert into friend set ?'
            db.query(sqladd, adddata, (err,result) => {
                if(err) return res.cc(err)
                if(result.affectedRows != 1) return res.cc('添加失败')
                return res.send({
                    status: 0,
                    message: '添加成功'
                })
            })
        }
    }catch (err) {
        res.cc(err)
    }

}
//查询添加我列表
exports.newaddfriend_func = async (req, res) => {
    let userid = req.auth.id
    let sqlfind = 'select username,head_pic,signature,sex,t.content,t.id as friendtableID from ev_users inner join (select * from friend where friendID = ? and friendstatus = 0) as t on  ev_users.id = t.userID'
    db.query(sqlfind,userid,(err,result) => {
        if(err) return res.cc(err)
        res.send({
            status: 0,
            message: '查询成功',
            data: result
        })
    })
}
//同意或拒绝添加好友
exports.agreeOrrefuseaddfriend_func = (req,res) => {
    let friendtableid = req.body.id
    let friendtype = req.body.friendtype
    let sqlupdateOrdelete = ''
    if(friendtype == 0) {
        sqlupdateOrdelete = 'delete from friend where id = ?'
    } else {
        sqlupdateOrdelete = 'update friend set friendstatus = 1 where id = ?'
    }
    db.query(sqlupdateOrdelete,friendtableid,(err,result) => {
        if(err) return res.cc(err)
        if(result.affectedRows !== 1) return res.cc('添加失败')
        res.send({
            status: 0,
            message: friendtype == 0 ? '拒绝成功' : '添加成功'
        })
    })
}
//删除好友
exports.deletefriend_func = async (req,res) => {
    let userid = req.auth.id
    let friendid = req.body.friendid
    try{
        let sqlfind = 'select * from friend where friendID = ? and userID = ? and friendstatus = 1'
        let result1 = await dbAsync(sqlfind,[userid,friendid])
        let result2 = await dbAsync(sqlfind,[friendid,userid])
        if(result1.length == 0 && result2.length == 0) return res.cc('删除失败')
        let deleteid = result1.length != 0 ? result1[0].id : result2[0].id
        let sqldel = 'delete from friend where id = ?'
        db.query(sqldel,deleteid,(err,result) => {
            if(err) return res.cc(err)
            if(result.affectedRows !== 1) return res.cc('删除失败')
            res.send({
                status: 0,
                message: '删除成功'
            })
        })
    }catch(err) {
        res.cc(err)
    }
}
//获去好友详情
exports.getfrienddetail_func = (req,res) => {
    let id = req.body.friendid
    let sqlfind = 'select id,username,sex,email,cell_phone,signature,head_pic,site from ev_users where id = ?'
    db.query(sqlfind,id,(err,result) => {
        if(err) return res.cc(err)
        if(result.length === 0) return res.cc('查询失败')
        res.send({
            status : 0,
            message: '查询成功',
            data: result[0]
        })
    })
}