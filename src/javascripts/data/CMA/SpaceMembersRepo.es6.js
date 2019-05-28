import { fetchAll } from './FetchAll.es6';

const headers = {
  // 'x-contentful-enable-alpha-feature': 'comments-api'
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
      return fetchAll(endpoint, ['space_members']);
    }
  };
}
