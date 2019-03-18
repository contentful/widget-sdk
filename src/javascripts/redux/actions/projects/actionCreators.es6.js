import createMicroBackendsClient from 'MicroBackendsClient.es6';
import * as actions from './actions.es6';

export function getAllProjects({ orgId }) {
  return async dispatch => {
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    dispatch(actions.getAllProjectsPending(orgId));

    let projects;

    try {
      const resp = await backend.call();

      projects = await resp.json();
    } catch (e) {
      dispatch(actions.getAllProjectsFailure(orgId, e));

      return;
    }

    dispatch(actions.getAllProjectsSuccess(orgId, projects));
  };
}

export function getProject({ orgId, projectId }) {
  return async dispatch => {
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    dispatch(actions.getProjectPending(orgId, projectId));

    const resp = await backend.call(`/${projectId}`);

    if (resp.status > 299) {
      const e = new Error('not found');
      dispatch(actions.getProjectFailure(orgId, projectId, e));

      return;
    }

    let project;

    try {
      project = await resp.json();
    } catch (e) {
      dispatch(actions.getProjectFailure(orgId, projectId, e));

      return;
    }

    dispatch(actions.getProjectSuccess(orgId, projectId, project));
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
