const { expect } = require('chai');

const { getRideRequestData } = require('../src/helpers/helper');
const testPayload = require('./mock.data');

describe('Test getRideRequestData', () => {
  describe('POST /rides', () => {
    it('should return a CustomError object', () => {
      const testData = { ...testPayload };
      testData.start_lat = -91;
      testData.start_long = 181;
      const result = getRideRequestData({ body: { ...testData } });
      expect(result.code).to.equal(400);
    });

    it('should return values array', () => {
      const result = getRideRequestData({ body: { ...testPayload } });
      expect(result).to.be.have.members([
        -90,
        -180,
        90,
        180,
        'Hashcode',
        'Leke',
        'Benz',
      ]);
    });
  });
});
