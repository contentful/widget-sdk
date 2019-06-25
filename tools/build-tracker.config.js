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

module.exports = {
  applicationUrl: 'https://user-interface-build-tracker.herokuapp.com',
  buildUrlFormat: 'https://github.com/contentful/user_interface/commit/:revision',
  baseDir: path.join(__dirname, '../build'),
  artifacts: ['./build/**/*.{js,css}'],
  getFilenameHash: getFilenameHash,
  nameMapper: nameMapper,
  onCompare: data => {
    console.log(data);
    return Promise.resolve();
  }
};
