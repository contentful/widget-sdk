'use strict';

module.exports = {
  apiVersion: 1,
  handle: ({ req }) => {
    const validEndpoint = req.path === '/send' && req.method === 'POST';

    if (!validEndpoint) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'applcation/json' },
        body: JSON.stringify({ meassage: 'Not found.' })
      };
    }

    const measurements = Array.isArray(req.body) ? req.body : [];
    const hasMeasurements = measurements.length > 0;

    if (!hasMeasurements) {
      return {
        statusCode: 422,
        headers: { 'Content-Type': 'applcation/json' },
        body: JSON.stringify({ meassage: 'No measurements provided.' })
      };
    }

    return {
      statusCode: 204,
      body: '',
      measurements: measurements.map(m => ({ ...m, name: `webapp.${m.name}` }))
    };
  }
};
