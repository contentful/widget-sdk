import _ from 'lodash';
import memoize from 'utils/memoize';
import { fetchAll } from 'data/CMA/FetchAll';

/**
 * @name data/userCache
 * @description
 * Creates a user cache for a space.
 *
 * Users are fetched only once, but we use the `FetchAll` utility so multiple
 * requests can be fired. All further calls to `get` and `getAll` will use
 * the first result.
 *
 * @usage[js]
 * import createCache from 'data/userCache'
 * var users = createCache(spaceContext.endpoint)
 *
 * // triggers request
 * users.getAll()
 * .then(function (users) {
 *   // users = [User, User]
 * })
 *
 * // does not trigger request
 * users.get('user_id')
 * .then(function (user) {
 *   // ...
 * })
 */
export default function createCache(endpoint) {
  const getUserMap = createUserFetcher(endpoint);

  const getUserList = memoize(() => getUserMap().then(_.values));

  return {
    getAll: getUserList,
    get: function (id) {
      return getUserMap().then((users) => users[id]);
    },
  };
}

function createUserFetcher(endpoint) {
  return memoize(() => fetchAll(endpoint, ['users'], 100).then(mapUsersById));
}

function mapUsersById(users) {
  return _.transform(
    users,
    (map, user) => {
      map[user.sys.id] = user;
    },
    {}
  );
}