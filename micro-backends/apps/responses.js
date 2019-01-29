'use strict';

const respond = (body, statusCode, measurements) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    measurements
  };
};

module.exports = {
  respond,
  respond404: measurements => respond({ message: 'Not found.' }, 404, measurements),
  respond422: measurements => respond({ message: 'Unprocessable entity.' }, 422, measurements)
};
