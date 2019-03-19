import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { __PROTOTYPE__PROJECTS } from 'redux/datasets.es6';

export function getAllProjects({ orgId }) {
  return async dispatch => {
    const backend = createMicroBackendsClient({
      backendName: '__PROTOTYPE__projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    dispatch({
      type: 'DATASET_LOADING',
      meta: { pending: true, orgId },
      datasets: [__PROTOTYPE__PROJECTS]
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
          [__PROTOTYPE__PROJECTS]: projects
        },
        orgId
      },
      meta: { fetched: Date.now() }
    });
  };
}
