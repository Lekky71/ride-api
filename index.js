const port = 8010;

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');
const appHandler = require('./src/app');
const logger = require('./src/logger');

db.serialize(() => {
  buildSchemas(db);

  const app = appHandler(db);

  app.listen(port, () => logger.info(`App started and listening on port ${port}`));
});
