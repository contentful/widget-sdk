const path = require('path');

const getFileExtension = fileName => {
  return fileName.split('.').pop();
};

const getFilenameHash = fileName => {
  const parts = path.basename(fileName, '.' + getFileExtension(fileName)).split('-');
  if (parts[parts.length - 1] === 'chunk') {
    parts.pop();
  }
  return parts.length > 1 ? parts[parts.length - 1] : null;
};

const nameMapper = fileName => {
  const extension = getFileExtension(fileName);
  const hash = getFilenameHash(fileName);
  const out = fileName.replace('.' + extension, '');
  const name = hash ? out.replace(`-${hash}`, '') : out;
  return `${name}.${extension}`;
};

const pathToBuiltAssets =
  process.env.PATH_TO_BUILT_ASSETS || path.resolve(__dirname, '../build/app');

module.exports = {
  applicationUrl: 'https://user-interface-build-tracker.herokuapp.com',
  buildUrlFormat: 'https://github.com/contentful/user_interface/commit/:revision',
  // this is on the output of configure-file-dist.js which moves files
  // into a different dir structure (as documented in that file)
  baseDir: pathToBuiltAssets,
  artifacts: [`${pathToBuiltAssets}/**/*.{js,css}`],
  getFilenameHash: getFilenameHash,
  nameMapper
};
