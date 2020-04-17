import { getModule } from 'core/NgRegistry';
import PropTypes from 'prop-types';

const getCurrentUser = () => {
  const spaceContext = getModule('spaceContext');

  // WARNING: This is not cloning to prevent a re-render due to object mismatch
  return spaceContext.user;
};

/**
 * Provides the current user object as the first arg to children
 */
export default function CurrentUserFetcher(props) {
  const currentUser = getCurrentUser();

  return props.children(currentUser);
}

CurrentUserFetcher.propTypes = {
  children: PropTypes.func.isRequired,
};
