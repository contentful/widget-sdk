import { useCallback, useReducer } from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { getSpaceInfo, getAllEnviroments } from '../utils';

const actionTypes = {
  initialize: 'initialize',
  selectSpace: 'select-space',
  selectEnvironment: 'select-env',
  updateEnvsList: 'update-envs-list',
};

const reducer = createImmerReducer({
  [actionTypes.initialize]: (state, action) => {
    const { space, spaces, envs } = action.payload;
    state.loading = false;
    state.spaceId = space.sys.id;
    state.environmentId = 'master';

    const orgs = {};
    spaces.forEach((space) => {
      const orgId = space.organization.sys.id;
      const orgName = space.organization.name;
      if (orgs[orgId]) {
        orgs[orgId].spaces.push(space);
      } else {
        orgs[orgId] = {
          id: orgId,
          name: orgName,
          spaces: [space],
        };
      }
    });
    state.organizations = Object.keys(orgs).map((key) => orgs[key]);
    state.environments = envs;
  },
  [actionTypes.selectEnvironment]: (state, action) => {
    state.environmentId = action.payload.environmentId;
  },
  [actionTypes.selectSpace]: (state, action) => {
    state.spaceId = action.payload.spaceId;
    state.environmentId = 'master';
  },
  [actionTypes.updateEnvsList]: (state, action) => {
    const { envs } = action.payload;
    state.environments = envs;
  },
});

export function useComponentState() {
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    organizations: [],
    environments: [],
    error: null,
    spaceId: '',
    environmentId: 'master',
  });

  const fetchInitialData = useCallback(async () => {
    const { space, spaces } = await getSpaceInfo();
    const envs = await getAllEnviroments(space.sys.id);
    dispatch({ type: actionTypes.initialize, payload: { space, spaces, envs } });
  }, [dispatch]);

  const selectSpace = useCallback(async (id) => {
    dispatch({ type: actionTypes.selectSpace, payload: { spaceId: id } });
    const envs = await getAllEnviroments(id);
    dispatch({ type: actionTypes.updateEnvsList, payload: { envs } });
  }, []);

  const selectEnvironment = useCallback((id) => {
    dispatch({ type: actionTypes.selectEnvironment, payload: { environmentId: id } });
  }, []);

  return {
    state,
    fetchInitialData,
    selectSpace,
    selectEnvironment,
  };
}
