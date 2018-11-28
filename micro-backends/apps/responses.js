'use strict';

const respond = (body, statusCode = 200) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
};

const respond404 = () => respond({ message: 'Not found.' }, 404);
const respond422 = () => respond({ message: 'Unprocessable entity.' }, 422);

module.exports = {
  respond,
  respond404,
  respond422
};
