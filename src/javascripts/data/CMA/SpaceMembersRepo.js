import { fetchAll } from './FetchAll';
import { TEAMS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(TEAMS_API);

export default function create(endpoint) {
  return {
    get() {
      return endpoint(
        {
          method: 'GET',
          path: ['space_members']
        },
        alphaHeader
      );
    },

    getAll() {
      return fetchAll(endpoint, ['space_members'], 100, {}, alphaHeader);
    }
  };
}
