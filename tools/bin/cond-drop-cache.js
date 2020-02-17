const path = require('path');
const rimraf = require('rimraf');

const projectRoot = path.resolve(__dirname, '..', '..');
const babelCache = path.join(projectRoot, 'node_modules', '.cache', 'babel-loader');

// execution assumes husky post-checkout githook
const [prevHead, newHead, isBranch] = process.env.HUSKY_GIT_PARAMS.split(' ');

if (isBranch && prevHead !== newHead) {
  console.log(`Dropping ${babelCache}`);
  rimraf.sync(babelCache);
  console.log(`Dropped ${babelCache}`);
}
