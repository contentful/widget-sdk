const path = require('path');
const { createApolloFetch } = require('apollo-fetch');
const fetch = require('node-fetch');

const uri = process.env.SNIFFER_UPLOAD_URL;
const apolloFetch = createApolloFetch({ uri });

apolloFetch.use(({ _, options }, next) => {
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['authorization'] = `Bearer ${process.env.SNIFFER_API_AUTH_TOKEN}`;

  next();
});

const getFileExtension = fileName => {
  return fileName
    .split('.')
    .splice(1)
    .join('.');
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

const pathToBuiltAssets = path.resolve(
  __dirname,
  process.env.PATH_TO_BUILT_ASSETS || '../build/app'
);

const uploadBuildSize = async (meta, artifacts) => {
  const response = await apolloFetch({
    query: `mutation SubmitData($meta: CommitMetaInput!, $artifacts: String!, $project: String!) {
      uploadBuildSize(meta: $meta, artifacts: $artifacts, project: $project)
    }`,
    variables: {
      meta: meta,
      project: 'user_interface',
      artifacts: JSON.stringify(artifacts)
    }
  });

  if (response.data && response.data.uploadBuildSize === true) {
    console.log('Successfully uploaded');
  } else {
    throw new Error(JSON.stringify(response.errors, null, 2));
  }
};

const compareBuilds = async commits => {
  const response = await apolloFetch({
    query: `query Compare(
      $project: String!,
      $commits: [String!]!,
      $groups: [CompareGroup!]
    ) {
      compareBuilds(
        project: $project,
        commits: $commits,
        groups: $groups
      ) {
        markdown
        markdownAll
        hasImpact
      }
    }`,
    variables: {
      project: 'user_interface',
      commits: commits,
      groups: [
        { name: 'Initial rendering', artifactNames: ['vendors~app.js', 'app.js', 'styles.css'] }
      ]
    }
  });
  if (response.data && response.data.compareBuilds) {
    return response.data.compareBuilds;
  } else {
    throw new Error(JSON.stringify(response.errors, null, 2));
  }
};

module.exports = {
  // this is on the output of configure-file-dist.js which moves files
  // into a different dir structure (as documented in that file)
  baseDir: pathToBuiltAssets,
  artifacts: [`${pathToBuiltAssets}/**/*.{js,css}`],
  getFilenameHash,
  nameMapper,
  // actually stands for on ready to upload
  onUpload: async build => {
    const { meta, artifacts } = build;

    await uploadBuildSize(meta, artifacts);

    const pr = process.env.PR_NUMBER || '';

    if (!pr) {
      return true;
    }

    const result = await compareBuilds([meta.parentRevision, meta.revision]);

    function getMessage(str) {
      return [
        '## Build Tracker',
        str,
        `[See details](https://contentful-sniffer.netlify.com/build-tracker#revs=${meta.parentRevision}&revs=${meta.revision})`
      ].join('\n\n');
    }

    if (!result.hasImpact) {
      console.log(
        `This PR has no impact on bundle size. Not posting a comment to PR#${pr} and moving on.`
      );
      console.log();
      // posting all results to CI logs
      console.log(getMessage(result.markdownAll));
      return true;
    }

    console.log('Build compare result ->', result);

    try {
      const { requestId, statusCode, message } = await fetch(process.env.COMMENT_LAMBDA_URL, {
        method: 'post',
        body: JSON.stringify({
          issue: Number.parseInt(pr, 10),
          message: getMessage(result.markdown),
          type: 'bundlesize'
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GITHUB_PAT_REPO_SCOPE_SQUIRELY}`
        }
      }).then(res => res.json());

      if (statusCode >= 400) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.requestId = requestId;

        throw error;
      }

      console.log(`Bundle size comment posted to PR#${pr} ->`, { requestId, statusCode, message });
    } catch (err) {
      console.error('Build tracker upload failed ->', err);
      console.log(`Comment won't be posted to PR#${pr}. Continuing anyway.`);
    }
  }
};
