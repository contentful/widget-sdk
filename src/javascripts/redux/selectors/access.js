import { get, flow, defaultTo } from 'lodash/fp';

const getAccessState = get('access');

/**
 * @description
 * Checks if page is accessible
 *
 * Not for general usage.
 * Currently only used for Teams page to check for teams catalog feature.
 *
 * @return {bool | null}
 */
export const hasAccess = flow(getAccessState, get('allowed'), defaultTo(false));

/**
 * @description
 * If page is not accesible, this return the reason.
 *
 * Not for general usage.
 * Currently only used for Teams page to check for teams catalog feature.
 *
 * @return {string | null}
 */
export const getReasonDenied = flow(getAccessState, get('reason'), defaultTo(null));
