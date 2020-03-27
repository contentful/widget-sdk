import { get, flow, defaultTo } from 'lodash/fp';
import { USERS } from '../datasets';

import { getDatasets } from './datasets';

/**
 * @description
 * Return map of all users in org, keyed by id
 *
 * @return {Object}
 */
export const getUsers = flow(getDatasets, get(USERS), defaultTo({}));

/**
 * @description
 * Return logged in user
 *
 * @return {Object}
 */
export const getCurrentUser = get('token.user');
