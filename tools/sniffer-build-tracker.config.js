const path = require('path');
const { createApolloFetch } = require('apollo-fetch');
const fetch = require('node-fetch');

const uri = process.env.SNIFFER_UPLOAD_URL;
const apolloFetch = createApolloFetch({ uri });

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
      $commits: [String!]!
    ) {
      compareBuilds(
        project: $project,
        commits: $commits
      ) {
        markdown
        markdownAll
        hasImpact
      }
    }`,
    variables: {
      project: 'user_interface',
      commits: commits
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

    if (!result.hasImpact) {
      console.log(
        `This PR has no impact on bundle size. Not posting a comment to PR#${pr} and moving on.`
      );
      return true;
    }

    console.log('Build compare result ->', result);

    const postMessage = [
      '## Build Tracker',
      result.markdown,
      '[Build Tracker UI](https://contentful-sniffer.netlify.com/build-tracker)'
    ].join('\n\n');

    try {
      const { requestId, statusCode, message } = await fetch(process.env.COMMENT_LAMBDA_URL, {
        method: 'post',
        body: JSON.stringify({
          issue: Number.parseInt(pr, 10),
          message: postMessage,
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
