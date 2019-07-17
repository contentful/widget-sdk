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
    const url = new URL(process.env.BUNDLESIZE_COMMENT_LAMBDA_URL);
    const options = {
      ...url,
      hostname: url.host,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${process.env.GITHUB_PAT_REPO_SCOPE_SQUIRELY}`
      }
    };
    delete options.host;
    console.log(options, payload);
    const req = https.request(options, res => {
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
    });

    req.on('error', reject);
    req.on('abort', reject);

    req.write(payload);
    req.end();
  });
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
  nameMapper: nameMapper,
  onCompare: async data => {
    const { markdown } = data;

    const pr = process.env.PR_NUMBER;
    if (!pr) {
      console.log('Not a PR. Not posting comment to GitHub issue');
    } else {
      if (!markdown) {
        console.log('No markdown found.', JSON.stringify(data, null, 2));
      } else {
        const postCommentResult = await postCommentToPR({
          issue: pr,
          message: markdown
        });
        console.log(postCommentResult);
      }
    }
    return Promise.resolve();
  }
};
