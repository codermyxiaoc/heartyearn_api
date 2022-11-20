//连接数据库
const mysql = require('mysql')

const db = mysql.createPool({
  host: '127.0.0.1' ,
  user: 'root' ,
  password: '******',
  database: 'interaction'
})

function dbAsync(sql,data) {
   return new Promise((resolve,resject) => {
    db.query(sql,data,(err,result) => {
      if(err) {
          resject(err)
      } else {
        resolve(result)
      }
    })
  })
}
module.exports = {
  db,
  dbAsync
}