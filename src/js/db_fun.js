const sqlite3 = require('sqlite3').verbose();
const path = require("path");
const dbPath = path.resolve(__dirname, '../images/satcat_reduced.db')

let db = new sqlite3.Database(dbPath, (err) => {
	console.log(dbPath)
    if (err) {
      console.error(err.message);
    }
	else{
    console.log('Connected to the database.');
	}
  });

exports.db = db

exports.rigaspecifica = (sql, param) =>{
        db.get(sql, [param], (err, row) => {
            if (err) {
                return console.error(err.message);
            }
            console.log(row)
            return row
        
        });
    }
