import { get, flow, defaultTo } from 'lodash/fp';

export const getAccessState = get('access');

// currently only used for Teams page to check for teams catalog feature

export const hasAccess = flow(
  getAccessState,
  get('allowed'),
  defaultTo(false)
);

export const getReasonDenied = flow(
  getAccessState,
  get('reason')
);
