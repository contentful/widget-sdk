import { getModule } from 'NgRegistry.es6';

import createFetcherComponent from 'app/common/createFetcherComponent.es6';

const UserFetcher = createFetcherComponent(props => {
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