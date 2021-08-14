let db;

exports.getDbObject = () => db;

exports.initDbObject = (database) => {
  db = database;
};
// any query: insert/delete/update
exports.run = (query, values) => new Promise((resolve, reject) => {
  db.run(query, values,
    (err) => {
      if (err) reject(err);
      else resolve(true);
    });
});

// set of rows read
exports.all = (query, params) => new Promise((resolve, reject) => {
  let parameters = params;
  if (params === undefined) {
    parameters = [];
  }

  db.all(query, parameters, (err, rows) => {
    if (err) reject(err);
    else {
      resolve(rows);
    }
  });
});
