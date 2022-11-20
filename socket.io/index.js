const jwt = require('jsonwebtoken')
const token_config = require('../token/config')

function socketIo(server) {
    let io = require('socket.io')(server, {cors: true})
    io.on('connection', (socket) => {
        let token = socket.handshake.query.token
        let userinfo = jwt.verify(token, token_config.jwtSecretKey)
        socket.userinfo = userinfo
        socket.emit('request', 'hello')
        socket.on('sendmsg', (message) => {
            console.log(message);
        })
        socket.on('sendMsg', (meg) => {
            console.log(meg)
            privateSendMsg(io, meg)
        })
    })
}

function privateSendMsg(io, meg) {
    Array.from(io.sockets.sockets).forEach(item => {
        if (item[1].userinfo.id == meg.friendid) {
            item[1].emit('privateSend', {
                message: meg.message,
                friendid: item[1].userinfo.id
            })
        }
    })
}


module.exports = socketIo;

