/* eslint-disable no-undef */
const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();
const { expect } = require('chai');

const database = new sqlite3.Database(':memory:');
const db = require('../src/database/sqlite.async');

describe('initDbObject for sqlite.async module', () => {
  it('should return a db object', async () => {
    db.initDbObject(database);
    expect(db.getDbObject()).to.equal(database);
  });
});

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

const testPayload = require('./mock.data');

const VALIDATION_ERROR = 'VALIDATION_ERROR';

describe('API tests', () => {
  before((done) => {
    database.serialize((err) => {
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

  describe('GET /api-docs', () => {
    it('should return 200 for api-docs', (done) => {
      request(app)
        .get('/api-docs')
        .expect('Content-Type', /text/)
        .expect(301, done);
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

    it('should return RIDES_NOT_FOUND_ERROR for no rides saved found', () => request(app)
      .get('/rides')
      .then((res) => {
        expect(res.body).to.have.property('message');
        assert.strictEqual(res.body.error_code, 'RIDES_NOT_FOUND_ERROR');
      }));

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
        expect(res.body).to.have.property('page');
        expect(res.body).to.have.property('size');
        expect(res.body).to.have.property('totalCount');
        expect(res.body).to.have.property('rides');
        assert.strictEqual(res.body.rides.length, 1);
      }));
  });

  describe('GET /rides/:id', () => {
    it('should return error of invalid id', () => request(app)
      .get('/rides/leke')
      .then((res) => {
        assert(res.body.error_code, VALIDATION_ERROR);
      }));
    it('should return ride by its id', () => request(app)
      .get('/rides/1')
      .then((res) => {
        assert.strictEqual(res.body.rideID, 1);
      }));
  });
});
