import { map, flatMap, flow, chunk, groupBy, keyBy, mapValues, reduce } from 'lodash/fp';
import getOrganizationsList from 'redux/selectors/getOrganizationsList.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const catalogFeatures = {
  TEAMS: 'teams'
};

export default ({ getState, dispatch }) => next => async action => {
  // check for orgs change, meaning the available orgs of the user changed (not the selected one)
  const oldOrgs = getOrganizationsList(getState());
  const result = next(action);
  const newOrgs = getOrganizationsList(getState());

  if (newOrgs && newOrgs !== oldOrgs) {
    const type = 'LOADING_CONSTANTS_FOR_ORGS';
    dispatch({ type, meta: { pending: true } });

    // General guide about using flow
    // and detailed explanation here: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792/Guide+for+handling+immutable+data+with+lodash+fp+and+flow#Guideforhandlingimmutabledatawith%60lodash/fp%60and%60flow%60-Example

    // get all features for all orgs with max 3 requests in parallel
    // this is just an optimization to not do too many requests in parallel
    const allFeatures = await flow(
      map('sys.id'),
      // get request promises for all features for each org as flat list
      flatMap(orgId =>
        flatMap(feature => {
          // TODO: THIS IS VERY BAD, REWRITE!
          // It causes (numberOfOrgs * keys(catalogFeatures).length * 2)
          // HTTP requests in the critical path for rendering the initial
          // view of the Web App. Until there's no "prefetch all features API"
          // any feature should be checked lazily only when needed using
          // the batching and cached client (`data/CMA/ProductCatalog.es6`).
          const endpoint = createOrganizationEndpoint(orgId);
          return endpoint({ method: 'GET', path: `/product_catalog_features/${feature}` });
        }, catalogFeatures)
      ),
      // makes chunks of 3 requests
      chunk(3),
      // request chunks in sequence but each chunks requests in parallel
      reduce(
        (previousP, chunkP) =>
          previousP.then(previous => Promise.all(chunkP).then(chunk => previous.concat(chunk))),
        Promise.resolve([])
      )
    )(newOrgs);

    // make a nested map by org and feature id
    const featuresByOrgAndFeatureName = flow(
      map('items[0]'),
      groupBy('sys.organization.sys.id'),
      // make arrays of features for each org and then key that arrays by their feature id
      mapValues(keyBy('sys.feature_id'))
    )(allFeatures);

    dispatch({ type, payload: { catalogFeatures: featuresByOrgAndFeatureName } });
  }
  return result;
};
