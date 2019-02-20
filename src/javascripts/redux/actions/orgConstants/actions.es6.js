export const ORG_CONSTANTS_PENDING = 'ORG_CONSTANTS_PENDING';
export function orgConstantsPending(orgId) {
  return {
    type: ORG_CONSTANTS_PENDING,
    payload: { orgId }
  };
}

export const ORG_CONSTANTS_SUCCESS = 'ORG_CONSTANTS_SUCCESS';
export function orgConstantsSuccess(orgId, data) {
  return {
    type: ORG_CONSTANTS_SUCCESS,
    payload: { orgId, data }
  };
}

export const ORG_CONSTANTS_FAILURE = 'ORG_CONSTANTS_FAILURE';
export function orgConstantsFailure(orgId, error) {
  return {
    type: ORG_CONSTANTS_FAILURE,
    payload: { orgId, error }
  };
}
