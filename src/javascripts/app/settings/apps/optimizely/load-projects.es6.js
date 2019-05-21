import constants from './constants.es6';

export function loadProjectsFromOptimizely(pat) {
  return new Promise(async resolve => {
    const result = await fetch('https://api.optimizely.com/v2/projects', {
      headers: {
        Authorization: `Bearer ${pat}`
      }
    });

    if (result.status !== constants.HTTP_STATUS_OK) {
      return resolve([null, new Error('Failed to pull projects from Optimizely')]);
    }

    resolve([await result.json()]);
  });
}

export function loadProjectsViaProxy(microBackendsClient) {
  return new Promise(async resolve => {
    const result = await microBackendsClient.proxyGetRequest(
      `optimizely`,
      'https://api.optimizely.com/v2/projects',
      {
        Authorization: `Bearer {pat}`
      }
    );

    if (result.status !== constants.HTTP_STATUS_OK) {
      return resolve([null, new Error('Failed to pull projects from Optimizely')]);
    }

    const proxyResponse = await result.json();
    if (proxyResponse.status !== constants.HTTP_STATUS_OK) {
      return resolve([null, new Error('Failed to pull projects from Optimizely')]);
    }

    let proxyResponseBody;

    try {
      proxyResponseBody = JSON.parse(proxyResponse.body);
    } catch (err) {
      return resolve([null, err]);
    }

    resolve([proxyResponseBody]);
  });
}
