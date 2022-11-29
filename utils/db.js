const sqlite3=require(`better-sqlite3`)



const path = require("path");
const dbPath = path.resolve(__dirname, '../utils/satcat_reduced.db')

let db = new sqlite3(dbPath,{verbose:console.log}) 

// .Database(dbPath, (err) => {
// 	console.log(dbPath)
//     if (err) {
//       console.error(err.message);
//     }
// 	else{
//     console.log('Connected to the database.');
// 	}
//   });


exports.db = db

