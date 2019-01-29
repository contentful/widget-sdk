import { get, flow, defaultTo } from 'lodash/fp';

export const getAccessState = get('access');

export const hasAccess = flow(
  getAccessState,
  get('allowed'),
  defaultTo(false)
);

export const getDeniedReason = flow(
  getAccessState,
  get('reason')
);
