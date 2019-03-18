import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { PROJECTS } from 'redux/datasets.es6';

import * as actions from './actions.es6';

export function getAllProjects({ orgId }) {
  return async dispatch => {
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    dispatch({
      type: 'DATASET_LOADING',
      meta: { pending: true, orgId },
      datasets: [PROJECTS]
    });

    let projects;

    try {
      const resp = await backend.call();

      projects = await resp.json();
    } catch (e) {
      dispatch({
        type: 'DATASET_LOADING',
        error: true,
        payload: e,
        meta: { orgId }
      });

      return;
    }

    dispatch({
      type: 'DATASET_LOADING',
      payload: {
        datasets: {
          [PROJECTS]: projects
        }
      },
      meta: { fetched: Date.now(), orgId }
    });
  };
}

export function createProject({ orgId, data }) {
  return async dispatch => {
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    dispatch(actions.createProjectPending(orgId));

    const resp = await backend.call(null, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    let project;

    try {
      project = await resp.json();
    } catch (e) {
      dispatch(actions.createProjectFailure(orgId, e));

      return;
    }

    dispatch(actions.createProjectSuccess(orgId, project));

    // await go({
    //   path: ['projects', 'home'],
    //   params: {
    //     orgId,
    //     projectId: project.sys.id
    //   }
    // });
  };
}

// export function updateProject({ orgId, projectId, data }) {
//   return async dispatch => {
//     const backend = createMicroBackendsClient({
//       backendName: 'projects',
//       baseUrl: `/organizations/${orgId}/projects`
//     });

//     const resp = await backend.call(`/${projectId}`, {
//       method: 'PUT',
//       body: data
//     });
//   }

// }

// export async function deleteProject({ orgId, projectId }) {
//   return async dispatch => {
//     const backend = createMicroBackendsClient({
//       backendName: 'projects',
//       baseUrl: `/organizations/${orgId}/projects`
//     });

//     const resp = await backend.call(`/${projectId}`, {
//       method: 'DELETE'
//     });
//   }
// }
