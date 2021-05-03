const analyzers = require('./analyzers');
const attributes = require('./attributes');
const createMigrationMessage = require('./createMigrationMessage');
const { createApolloFetch } = require('apollo-fetch');
const fs = require('fs').promises;

const uri = process.env.SNIFFER_UPLOAD_URL;
const apolloFetch = createApolloFetch({ uri });

apolloFetch.use(({ _, options }, next) => {
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['authorization'] = `Bearer ${process.env.SNIFFER_API_AUTH_TOKEN}`;

  next();
});

const uploadResults = async ({ meta, tree, stats }) => {
  const response = await apolloFetch({
    query: `mutation SubmitData($meta: CommitMetaInput!, $tree: String!, $stats: String!, $project: String!) {
      uploadReactMigration(meta: $meta, tree: $tree, stats: $stats, project: $project)
    }`,
    variables: {
      meta: meta,
      project: 'user_interface',
      tree: JSON.stringify(tree),
      stats: JSON.stringify(stats),
    },
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
        hasImpact
      }
    }`,
    variables: {
      project: 'user_interface',
      revisionOne,
      revisionTwo,
    },
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
  onUpload: async (data) => {
    const { meta, stats, tree } = data;
    await uploadResults({ meta, stats, tree });

    const pr = process.env.PR_NUMBER || '';
    if (!pr) {
      return true;
    }

    const { diff, markdown, hasImpact } = await migrationDiff(meta.parentRevision, meta.revision);

    if (!diff || !hasImpact) {
      console.log(
        `This PR does not impact migration to react. Not posting comment to PR#${pr} and moving on.`
      );
      return true;
    }

    const diffJson = JSON.parse(diff);
    const postMessage = [
      '## React migration',
      markdown,
      createMigrationMessage(diffJson),
      '[Sniffer](https://contentful-sniffer.netlify.com/pr-log)',
    ].join('\n\n');

    // will be used in a subsequent CircleCI step
    await fs.writeFile(process.env.SNIFFER_MARKDOWN_FILE, postMessage);
  },
};
