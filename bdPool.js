const mysql = require("mysql")

module.exports = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "Jmail09022006@",
    database: "training",
    connectionLimit: 7
})