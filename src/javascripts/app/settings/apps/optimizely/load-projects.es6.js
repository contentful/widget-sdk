import constants from './constants.es6';

function isActiveFullStackProject(project) {
  return project.status === 'active' && project.platform === 'custom';
}

export function loadProjectsFromOptimizely(pat) {
  return new Promise(async resolve => {
    const result = await window.fetch('https://api.optimizely.com/v2/projects', {
      headers: {
        Authorization: `Bearer ${pat}`
      }
    });

    if (result.status !== constants.HTTP_STATUS_OK) {
      return resolve([null, new Error('Failed to pull projects from Optimizely')]);
    }

    try {
      const projects = await result.json();
      resolve([projects.filter(isActiveFullStackProject)]);
    } catch (err) {
      resolve([null, err]);
    }
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

    try {
      const projects = JSON.parse(proxyResponse.body);
      resolve([projects.filter(isActiveFullStackProject)]);
    } catch (err) {
      return resolve([null, err]);
    }
  });
}
