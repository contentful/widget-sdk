import { fetchAll } from './FetchAll';

const headers = {
  'x-contentful-enable-alpha-feature': 'teams-api'
};

export default function create(endpoint) {
  return {
    get() {
      return endpoint(
        {
          method: 'GET',
          path: ['space_members']
        },
        headers
      );
    },

    getAll() {
      return fetchAll(endpoint, ['space_members'], 100, {}, headers);
    }
  };
}
