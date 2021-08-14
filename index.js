const port = 8010;

const sqlite3 = require('sqlite3').verbose();

const database = new sqlite3.Database(':memory:');
const db = require('./src/database/sqlite.async');

const buildSchemas = require('./src/schemas');
const appHandler = require('./src/app');
const logger = require('./src/logger');

database.serialize(async () => {
  db.initDbObject(database);
  await buildSchemas(db);

  const app = appHandler(db);

  app.listen(port, () => logger.info(`App started and listening on port ${port}`));
});
