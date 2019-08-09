const analyzers = require('./analyzers');
const attributes = require('./attributes');
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

module.exports = {
  roots: ['src/javascripts', 'test'],
  analyzers: analyzers,
  attributes: attributes,
  exclude: /(node_modules|\.git|\.DS_Store|\.js\.snap)/,
  onUpload: async data => {
    const { meta, stats, tree } = data;
    return await uploadResults({ meta, stats, tree });
  }
};
