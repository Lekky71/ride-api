const port = 8010;

const sqlite3 = require('sqlite3').verbose();
const compression = require('compression');
const helmet = require('helmet');

const database = new sqlite3.Database(':memory:');
const db = require('./src/database/sqlite.async');

const buildSchemas = require('./src/schemas');
const appHandler = require('./src/app');
const logger = require('./src/logger');

database.serialize(async () => {
  db.initDbObject(database);
  await buildSchemas(db);

  const app = appHandler(db);

  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          // don't compress responses with this request header
          return false;
        }
        // fallback to standard filter function
        return compression.filter(req, res);
      },
    }),
  );

  /**
   * Helmet for additional server security
   *  xssfilter, frameguard etc.
   *  https://www.npmjs.com/package/helmet
   */
  app.use(helmet({
    contentSecurityPolicy: true,
  }));

  app.disable('x-powered-by');

  app.listen(port, () => logger.info(`App started and listening on port ${port}`));
});
