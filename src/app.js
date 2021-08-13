const express = require('express');
const YAML = require('yamljs');

const app = express();

const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');

const logger = require('./logger');

const swaggerDocument = YAML.load(`${__dirname.replace('/src', '')}/document.yaml`);

const jsonParser = bodyParser.json();

this.lastID = 0;

module.exports = (db) => {
  app.get('/health', (req, res) => res.send('Healthy'));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.post('/rides', jsonParser, (req, res) => {
    const startLatitude = Number(req.body.start_lat);
    const startLongitude = Number(req.body.start_long);
    const endLatitude = Number(req.body.end_lat);
    const endLongitude = Number(req.body.end_long);
    const riderName = req.body.rider_name;
    const driverName = req.body.driver_name;
    const driverVehicle = req.body.driver_vehicle;

    if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180
      || startLongitude > 180) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
      });
    }

    if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
      });
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string',
      });
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string',
      });
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string',
      });
    }

    const values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long,
      req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

    return db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, '
      + 'driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, (err) => {
      if (err) {
        return res.send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }
      this.lastID += 1;

      return db.all('SELECT * FROM Rides WHERE rideID = ? LIMIT 1', this.lastID, (err1, rows) => {
        if (err1) {
          return res.send({
            error_code: 'SERVER_ERROR',
            message: 'Unknown error',
          });
        }
        return res.send(rows[0]);
      });
    });
  });

  app.get('/rides', (req, res) => {
    const page = Number(req.query.page || 1);
    const size = Number(req.query.size || 20);
    db.all('SELECT COUNT(*) FROM Rides;', (err, countRows) => {
      if (err) {
        logger.error(err);
        return res.send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }
      const totalCount = countRows[0]['COUNT(*)'];
      if (totalCount === 0) {
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        });
      }
      return db.all(`SELECT * FROM Rides LIMIT ${size} OFFSET ${(page * size) - size}`, (err1, rows) => {
        if (err1) {
          logger.error(err1);
          return res.send({
            error_code: 'SERVER_ERROR',
            message: 'Unknown error',
          });
        }

        return res.send({
          page,
          size,
          nextPage: (rows.length * page) < totalCount ? page + 1 : null,
          totalCount,
          count: rows.length,
          rides: rows,
        });
      });
    });
  });

  app.get('/rides/:id', (req, res) => {
    db.all(`SELECT * FROM Rides WHERE rideID=${Number(req.params.id)} LIMIT 1`, (err, rows) => {
      if (err) {
        logger.error(err);
        return res.send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }

      if (rows.length === 0) {
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        });
      }

      return res.send(rows[0]);
    });
  });

  return app;
};
