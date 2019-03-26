'use strict';

const stream = require('getstream');

module.exports = {
  apiVersion: 1,
  memorySize: 256,
  timeout: 5,
  handle: ({ req, env }) => {
    const validEndpoint = req.path === '/generate' && req.method === 'POST';
    const id = req.body.id;
    let API_SECRET = '8y3jtt9egka49ntw2n2eymhks9xw7cumzcmtvsyzqnn6sqjwgnfg6dnn33mqz72n';
    let API_KEY = 'sn52ecswbc5m';
    let APP_ID = '49437';

    if (env === 'prod') {
      API_SECRET = 'qbc5nhwvwpwsuvm8dac58e98c2r6ze63duqptbkw4ng38bf3622ktysbngsk8mtc';
      API_KEY = 'qp5baq8rq72f';
      APP_ID = '49481';
    } else if (env === 'preview') {
      API_SECRET = 'jmc4nadttpcsqgmjtcu5z54vf4gctggcs8qx9rma2tpndnzxdye4kc9g9zgfywbq';
      API_KEY = 'nfxztxwmj2sd';
      APP_ID = '49557';
    }

    if (!validEndpoint || !id) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meassage: 'Not found.' })
      };
    }

    const client = stream.connect(API_KEY, API_SECRET, APP_ID);
    const userToken = client.createUserToken(String(id));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: userToken
    };
  }
};
