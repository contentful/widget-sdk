import { getModule } from 'core/NgRegistry';

import createFetcherComponent from 'app/common/createFetcherComponent';

const UserFetcher = createFetcherComponent((props) => {
  const spaceContext = getModule('spaceContext');

  return spaceContext.users.get(props.userId);
});

/**
 * Component fetches user with given id.
 *
 * @class UserNameFormatter
 * @extends {Component}
 */
export default UserFetcher;
