const express = require('express');
const YAML = require('yamljs');

const app = express();

const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');

const logger = require('./logger');
const { respondError, getRideRequestData } = require('./helpers/helper');

const swaggerDocument = YAML.load(`${__dirname.replace('/src', '')}/document.yaml`);

const jsonParser = bodyParser.json();

this.lastID = 0;

module.exports = (db) => {
  app.get('/health', (req, res) => res.send('Healthy'));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.post('/rides', jsonParser, async (req, res) => {
    const requestData = getRideRequestData(req);
    if (!Array.isArray(requestData)) {
      return respondError(res, requestData.code, requestData.message);
    }
    try {
      await db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, '
        + 'driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', requestData);
      this.lastID += 1;
      logger.info(`Successfully saved ride with id ${this.lastID}`);
      const rows = await db.all('SELECT * FROM Rides WHERE rideID = ? LIMIT 1', this.lastID);
      return res.send(rows[0]);
    } catch (err) {
      logger.error(err);
      return respondError(res, 500);
    }
  });

  app.get('/rides', async (req, res) => {
    const page = Number(req.query.page || 1);
    const size = Number(req.query.size || 20);
    try {
      logger.info('Fetching all rides');
      const countRows = await db.all('SELECT COUNT(*) FROM Rides;');
      const totalCount = countRows[0]['COUNT(*)'];
      if (totalCount === 0) {
        return respondError(res, 404, 'Could not find any rides');
      }
      const rows = await db.all('SELECT * FROM Rides LIMIT ? OFFSET ?;', [size, (page * size) - size]);
      return res.send({
        page,
        size,
        nextPage: (rows.length * page) < totalCount ? page + 1 : null,
        totalCount,
        count: rows.length,
        rides: rows,
      });
    } catch (err) {
      logger.error(err);
      return respondError(res, 500);
    }
  });

  app.get('/rides/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (Number.isNaN(id) || !Number.isInteger(Number(id)) || Number(id) < 1) {
        return respondError(res, 400, 'Invalid id, must be an integer greater than 0');
      }
      logger.info(`Fetching ride with id ${id}`);
      const rows = await db.all('SELECT * FROM Rides WHERE rideID = ? LIMIT 1', Number(id));
      if (rows.length === 0) {
        return respondError(res, 404, `Could not find the ride with id ${id}`);
      }

      return res.send(rows[0]);
    } catch (err) {
      logger.error(err);
      return respondError(res, 500);
    }
  });

  return app;
};
