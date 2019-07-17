const path = require('path');
const https = require('https');

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

const postCommentToPR = jsonPayload => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(jsonPayload);
    const url = process.env.BUNDLESIZE_COMMENT_LAMBDA_URL;
    const req = https.request(
      {
        ...new URL(url),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Bearer ${process.env.GITHUB_PAT_REPO_SCOPE_SQUIRELY}`
        }
      },
      res => {
        let result = '';
        res.setEncoding('utf8');

        console.log(`POST ${url}`);
        console.log(`\t Status code: ${res.statusCode}`);
        console.log(`\t Headers: ${res.headers}`);

        res.on('data', chunk => (result += chunk));

        res.on('end', () => {
          if (res.statusCode >= 400) {
            resolve(JSON.parse(result));
          }
          return resolve({
            result
          });
        });
      }
    );

    req.on('error', reject);
    req.on('abort', reject);

    req.write(payload);
    req.end();
  });
};

module.exports = {
  applicationUrl: 'https://user-interface-build-tracker.herokuapp.com',
  buildUrlFormat: 'https://github.com/contentful/user_interface/commit/:revision',
  // this is on the output of configure-file-dist.js which moves files
  // into a different dir structure (as documented in that file)
  baseDir: path.join(__dirname, process.env.PATH_TO_BUILT_ASSETS || '../build/app'),
  artifacts: ['./*.{js,css}'],
  getFilenameHash: getFilenameHash,
  nameMapper: nameMapper,
  onCompare: message => {
    console.log(message);
    console.log(process.env);
    const pr = process.env.PR_NUMBER;
    if (!pr) {
      return Promise.resolve('Not a PR. Not posting comment to GitHub issue');
    }
    return postCommentToPR({
      issue: pr,
      message
    });
  }
};
