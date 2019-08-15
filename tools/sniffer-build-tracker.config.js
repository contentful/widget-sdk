const path = require('path');
const { createApolloFetch } = require('apollo-fetch');
const got = require('got');

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
    const result = await compareBuilds([meta.parentRevision, meta.revision]);
    const pr = process.env.PR_NUMBER || '';

    console.log('Build compare result ->', result);

    try {
      await got.post(process.env.BUNDLESIZE_COMMENT_LAMBDA_URL, {
        body: {
          issue: pr,
          message: result.markdownAll,
          type: 'bundlesize'
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GITHUB_PAT_REPO_SCOPE_SQUIRELY}`
        }
      });
    } catch (err) {
      console.error('Build tracker upload failed ->', err);
      console.log(`Comment won't be posted to PR#${pr}. Continuing anyway.`);
    }
  }
};
