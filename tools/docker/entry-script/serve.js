import * as B from 'bluebird';
import * as P from 'path';
import {createServer} from 'http';
import express from 'express';
import {render as renderIndex} from '../../lib/index-page';
import {readJSON, readMergeJSON} from '../../lib/utils';

// TODO unify with index configurator
const MANIFEST_PATHS = [
  'build/static-manifest.json',
  'build/styles-manifest.json',
  'build/app-manifest.json'
];

/**
 * Serve the application files from the build directory on localhost:3001.
 *
 * The application is configured with config/development.json.
 */
export default function* serve () {
  const assetsDir = P.resolve('build', 'app');
  const configPath = P.resolve('config', 'development.json');
  const [manifest, config] = yield B.all([
    readMergeJSON(MANIFEST_PATHS),
    readJSON(configPath)
  ]);

  const app = express();
  app.use('/app', express.static(assetsDir));
  app.get('*', function (req, res, next) {
    if (req.accepts('html')) {
      res.status(200);
      res.type('html');
      res.end(renderIndex('dev', config, manifest));
    } else {
      next();
    }
  });
  app.use((_, res) => res.sendStatus(404));

  const server = createServer(app);
  yield new B.Promise(function (resolve, reject) {
    server.listen(3001, resolve);
    server.once('error', reject);
  });

  const {address, port} = server.address();
  console.log(`Serving Contentful Web App at ${address}:${port}`);
  return () => server.close();
}
