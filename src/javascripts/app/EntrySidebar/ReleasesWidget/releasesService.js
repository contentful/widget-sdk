// import { getModule } from 'core/NgRegistry';
// import * as EndpointFactory from 'data/EndpointFactory';
// import APIClient from 'data/APIClient.js';
import { releases } from './__fixtures__';

// function createEndpoint() {
//   const spaceContext = getModule('spaceContext');
//   return EndpointFactory.createSpaceEndpoint(
//     spaceContext.space.data.sys.id,
//     spaceContext.space.environment.sys.id
//   );
// }

async function getReleases(_query) {
  // const apiClient = new APIClient(createEndpoint());
  // return await apiClient.getReleases(query);
  return Promise.resolve(releases);
}

export { getReleases };
