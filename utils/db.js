const sqlite3=require(`better-sqlite3`)

const path = require("path");
const dbPath = path.resolve(__dirname, '../utils/satcat_reduced.db')

let db = new sqlite3(dbPath,{verbose:console.log}) 

exports.db = db

