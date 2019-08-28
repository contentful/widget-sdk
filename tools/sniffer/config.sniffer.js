const analyzers = require('./analyzers');
const attributes = require('./attributes');
const fetch = require('node-fetch');
const createMigrationMessage = require('./createMigrationMessage');
const { createApolloFetch } = require('apollo-fetch');

const uri = process.env.SNIFFER_UPLOAD_URL;
const apolloFetch = createApolloFetch({ uri });

const uploadResults = async ({ meta, tree, stats }) => {
  const response = await apolloFetch({
    query: `mutation SubmitData($meta: CommitMetaInput!, $tree: String!, $stats: String!, $project: String!) {
      uploadReactMigration(meta: $meta, tree: $tree, stats: $stats, project: $project)
    }`,
    variables: {
      meta: meta,
      project: 'user_interface',
      tree: JSON.stringify(tree),
      stats: JSON.stringify(stats)
    }
  });

  if (response.data && response.data.uploadReactMigration === true) {
    console.log('Successfully uploaded');
  } else {
    throw new Error(JSON.stringify(response.errors, null, 2));
  }
};

const migrationDiff = async (revisionOne, revisionTwo) => {
  const response = await apolloFetch({
    query: `query migrationDiff($project: String!, $revisionOne: String!, $revisionTwo: String!) {
      migrationDiff(project: $project, revisionOne: $revisionOne, revisionTwo: $revisionTwo) {
        diff
        markdown
      }
    }`,
    variables: {
      project: 'user_interface',
      revisionOne,
      revisionTwo
    }
  });
  if (response.data && response.data.migrationDiff) {
    return response.data.migrationDiff;
  } else {
    throw new Error(JSON.stringify(response.errors, null, 2));
  }
};

module.exports = {
  roots: ['src/javascripts', 'test'],
  analyzers: analyzers,
  attributes: attributes,
  exclude: /(node_modules|\.git|\.DS_Store|\.js\.snap)/,
  onUpload: async data => {
    const { meta, stats, tree } = data;
    await uploadResults({ meta, stats, tree });

    const pr = process.env.PR_NUMBER || '';
    if (!pr) {
      return true;
    }

    const { diff, markdown } = await migrationDiff(meta.parentRevision, meta.revision);

    if (!diff) {
      return true;
    }

    try {
      const diffJson = JSON.parse(diff);
      const postMessage = [
        '## React migration',
        markdown,
        createMigrationMessage(diffJson),
        '[Sniffer](https://contentful-sniffer.netlify.com/pr-log)'
      ].join('\n\n');

      const { requestId, statusCode, message } = await fetch(process.env.COMMENT_LAMBDA_URL, {
        method: 'post',
        body: JSON.stringify({
          issue: Number.parseInt(pr, 10),
          message: postMessage,
          type: 'migration'
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

      console.log(`Migration comment posted to PR#${pr} ->`, { requestId, statusCode, message });
    } catch (err) {
      console.error('Migration comment upload failed ->', err);
      console.log(`Comment won't be posted to PR#${pr}. Continuing anyway.`);
    }
  }
};
