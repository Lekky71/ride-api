/* eslint-disable no-undef */
const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

const testPayload = {
  start_lat: -90,
  start_long: -180,
  end_lat: 90,
  end_long: 180,
  rider_name: 'Hashcode',
  driver_name: 'Leke',
  driver_vehicle: 'Benz',
};
const VALIDATION_ERROR = 'VALIDATION_ERROR';

describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err);
      }

      buildSchemas(db);

      return done();
    });
  });

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
        .get('/health')
        .expect('Content-Type', /text/)
        .expect(200, done);
    });
  });

  // Test validation error
  describe('POST /rides', () => {
    it('should return validation error for Start latitude and Longitude', () => {
      const testData = { ...testPayload };
      testData.start_lat = -91;
      testData.start_long = 181;
      return request(app)
        .post('/rides')
        .send(testData)
        .then((res) => {
          assert(res.body.error_code, VALIDATION_ERROR);
        });
    });

    it('should return validation error for End latitude', () => {
      const testData = { ...testPayload };
      testData.end_long = 181;
      return request(app)
        .post('/rides')
        .send(testData)
        .then((res) => {
          assert(res.body.message, VALIDATION_ERROR);
        });
    });

    it('should return validation error for rider name', () => {
      const testData = { ...testPayload };
      testData.rider_name = 5;
      return request(app)
        .post('/rides')
        .send(testData)
        .then((res) => {
          assert(res.body.error_code, VALIDATION_ERROR);
        });
    });

    it('should return validation error for driver name', () => {
      const testData = { ...testPayload };
      testData.driver_name = '';
      return request(app)
        .post('/rides')
        .send(testData)
        .then((res) => {
          assert(res.body.error_code, VALIDATION_ERROR);
        });
    });

    it('should return validation error for driver vehicle', () => {
      const testData = { ...testPayload };
      testData.driver_vehicle = '';
      return request(app)
        .post('/rides')
        .send(testData)
        .then((res) => {
          assert(res.body.error_code, VALIDATION_ERROR);
        });
    });

    it('should return 200', () => request(app)
      .post('/rides')
      .send(testPayload)
      .then((res) => {
        assert(res.status, '200');
      }));
  });

  describe('GET /rides', () => {
    it('should return saved rides', () => request(app)
      .get('/rides')
      .then((res) => {
        assert.strictEqual(res.body.length, 1);
      }));
  });

  describe('GET /rides/:id', () => {
    it('should return saved rides', () => request(app)
      .get('/rides/1')
      .then((res) => {
        assert.strictEqual(res.body[0].rideID, 1);
      }));
  });
});
