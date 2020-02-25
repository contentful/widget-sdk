const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { upload } = require('bugsnag-sourcemaps');

// TODO: this should not be hardcoded here
// Environment variable, maybe?
const apiKey = 'b253f10d5d0184a99e1773cec7b726e8';

const projectDir = path.resolve(__dirname, '..', '..', '..');
const sourcemapsDir = path.join(projectDir, 'public', 'sourcemaps');
const appDir = path.join(projectDir, 'public', 'app');

module.exports = async function uploadSourcemapsToBugsnag({ version }) {
  const appFiles = fs.readdirSync(appDir, { withFileTypes: true });
  const uploadSourcemap = promisify(upload);

  const promises = [];

  for (const file of appFiles) {
    if (file.isFile() && /.*\.js$/.test(file.name)) {
      const sourceFilename = file.name;
      const sourcemapFilename = `${file.name}.map`;

      const sourcePath = path.join(appDir, sourceFilename);
      const sourcemapPath = path.join(sourcemapsDir, sourcemapFilename);

      promises.push(
        uploadSourcemap({
          apiKey,
          appVersion: version,
          minifiedUrl: `*/app/${sourceFilename}`,
          minifiedFile: sourcePath,
          sourceMap: sourcemapPath,
          overwrite: true
        }).then(() => {
          console.log(`Uploaded ${sourcemapFilename}`);
        })
      );
    }
  }

  await Promise.all(promises);

  console.log('\nFinished uploading sourcemaps to Bugsnag.\n');
};
