export const GET_ALL_PROJECTS_PENDING = 'GET_ALL_PROJECT/PENDING';
export function getAllProjectsPending(orgId) {
  return {
    type: GET_ALL_PROJECTS_PENDING,
    meta: {
      orgId
    }
  };
}

export const GET_ALL_PROJECTS_SUCCESS = 'GET_ALL_PROJECT/SUCCESS';
export function getAllProjectsSuccess(orgId, projects) {
  return {
    type: GET_ALL_PROJECTS_SUCCESS,
    payload: projects,
    meta: {
      orgId
    }
  };
}

export const GET_ALL_PROJECTS_FAILURE = 'GET_ALL_PROJECT/FAILURE';
export function getAllProjectsFailure(orgId, e) {
  return {
    type: GET_ALL_PROJECTS_SUCCESS,
    error: true,
    payload: e,
    meta: {
      orgId
    }
  };
}

export const GET_PROJECT_PENDING = 'GET_PROJECT/PENDING';
export function getProjectPending(orgId, projectId) {
  return {
    type: GET_PROJECT_PENDING,
    meta: {
      orgId,
      projectId
    }
  };
}

export const GET_PROJECT_SUCCESS = 'GET_PROJECT/SUCCESS';
export function getProjectSuccess(orgId, projectId, project) {
  return {
    type: GET_PROJECT_SUCCESS,
    payload: project,
    meta: {
      orgId,
      projectId
    }
  };
}

export const GET_PROJECT_FAILURE = 'GET_PROJECT/FAILURE';
export function getProjectFailure(orgId, projectId, e) {
  return {
    type: GET_PROJECT_FAILURE,
    error: true,
    payload: e,
    meta: {
      orgId,
      projectId
    }
  };
}

export const CREATE_PROJECT_PENDING = 'CREATE_PROJECT/PENDING';
export function createProjectPending(orgId) {
  return {
    type: CREATE_PROJECT_PENDING,
    meta: {
      orgId
    }
  };
}

export const CREATE_PROJECT_SUCCESS = 'CREATE_PROJECT/SUCCESS';
export function createProjectSuccess(orgId, project) {
  return {
    type: CREATE_PROJECT_SUCCESS,
    payload: project,
    meta: {
      orgId
    }
  };
}

export const CREATE_PROJECT_FAILURE = 'CREATE_PROJECT/FAILURE';
export function createProjectFailure(orgId, e) {
  return {
    type: CREATE_PROJECT_FAILURE,
    error: true,
    payload: e,
    meta: {
      orgId
    }
  };
}

// export const UPDATE_PROJECT_PENDING = 'UPDATE_PROJECT/PENDING';
// export const UPDATE_PROJECT_SUCCESS = 'UPDATE_PROJECT/SUCCESS';
// export const UPDATE_PROJECT_FAILURE = 'UPDATE_PROJECT/FAILURE';
// export const DELETE_PROJECT_PENDING = 'DELETE_PROJECT/PENDING';
// export const DELETE_PROJECT_SUCCESS = 'DELETE_PROJECT/SUCCESS';
// export const DELETE_PROJECT_FAILURE = 'DELETE_PROJECT/FAILURE';
