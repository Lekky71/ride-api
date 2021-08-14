const CustomError = require('./error');

// DRY code to send error response
const respondError = (res, errorCode, message = 'Unknown error') => {
  const errors = { 400: 'VALIDATION_ERROR', 404: 'RIDES_NOT_FOUND_ERROR', 500: 'SERVER_ERROR' };
  return res.status(errorCode).send({
    error_code: errors[errorCode],
    message,
  });
};

module.exports.respondError = respondError;

// Validate and extract POST /rides request data
module.exports.getRideRequestData = (req) => {
  const startLatitude = Number(req.body.start_lat);
  const startLongitude = Number(req.body.start_long);
  const endLatitude = Number(req.body.end_lat);
  const endLongitude = Number(req.body.end_long);
  const riderName = req.body.rider_name;
  const driverName = req.body.driver_name;
  const driverVehicle = req.body.driver_vehicle;

  if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180
    || startLongitude > 180) {
    return new CustomError(400, 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively');
  }

  if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
    return new CustomError(400, 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively');
  }

  if (typeof riderName !== 'string' || riderName.length < 1) {
    return new CustomError(400, 'Rider name must be a non empty string');
  }

  if (typeof driverName !== 'string' || driverName.length < 1) {
    return new CustomError(400, 'Driver name must be a non empty string');
  }

  if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
    return new CustomError(400, 'Driver vehicle must be a non empty string');
  }

  return [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long,
    req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
};
