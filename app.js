const express = require('express')
const joi = require('joi')
const cors = require('cors')
const { expressjwt: jwt } = require('express-jwt')
const config = require('./token/config')
const http = require('http')
const socketIo = require('./socket.io')

const app = express()

const server = http.createServer(app)

socketIo(server)

//第三方插件挂载
app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use(express.json())

//自定义插件挂载
app.use((req, res, next) => {
  res.cc = function (err, status = 1) {
    res.send({
      status,
      message: err instanceof Error ? err.message : err
    })
  }
  next()
})

//静态资源
app.use(express.static('./static'))
app.use('\/page\/[0-9@.qcom]+', express.static('./page'))
app.use('\/page\/[0-9@.qcom]+',express.static('./page'))
//token验证
app.use(jwt({secret: config.jwtSecretKey, algorithms: ["HS256"]}).unless({path: [/^\/api/]}))

//路由导入
const user_router = require('./router/user')
const userinfo_router =require('./router/userinfo')
const group_router = require('./router/group')
//路由挂载
app.use('/api',user_router)
app.use('/user', userinfo_router)
app.use('/group',group_router)

//处理错误插件
app.use((err, req, res, next) => {
  if (err instanceof joi.ValidationError) {
    return res.cc(err)
  }
  if (err.name === 'UnauthorizedError') {
    return res.cc('身份认证失败')
  }
  res.cc(err)
})

//运行
server.listen(80,() => {
  console.log('http://127.0.0.1');
})

