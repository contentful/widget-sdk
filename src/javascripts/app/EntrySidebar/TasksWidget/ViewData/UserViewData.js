import PropTypes from 'prop-types';
import { sortBy } from 'lodash';

export const UserViewData = {
  isLoading: PropTypes.bool,
  key: PropTypes.string,
  label: PropTypes.string,
  avatarUrl: PropTypes.string,
  isRemovedFromSpace: PropTypes.bool,
};

export const UserSelectorViewData = {
  isLoading: PropTypes.bool,
  availableUsers: PropTypes.arrayOf(PropTypes.shape(UserViewData)),
  selectedUser: PropTypes.shape(UserViewData),
};

export function createSpaceUserSelectorViewData(usersFetchingStatus) {
  const { isLoading = true, data } = usersFetchingStatus;
  const usersVD = (data || []).map(createUserViewData);
  return {
    isLoading,
    availableUsers: sortBy(usersVD, (user) => user.label.toLowerCase()),
    selectedUser: null,
  };
}

export function createUserViewDataFromLinkAndFetcher(userLink, usersFetchingStatus) {
  const { isLoading = true, data: users } = usersFetchingStatus;
  if (isLoading) {
    return createLoadingUserViewDataFromLink(userLink);
  }
  const user = users && users.find((user) => user.sys.id === userLink.sys.id);
  return user ? createUserViewData(user) : createMissingUserViewDataFromLink(userLink);
}

function createUserViewData(user) {
  return {
    isLoading: false,
    key: user.sys.id,
    label: getUserLabel(user),
    avatarUrl: user.avatarUrl,
    isRemovedFromSpace: false,
  };
}

function createMissingUserViewDataFromLink(userLink) {
  return {
    isLoading: false,
    key: userLink.sys.id,
    label: null,
    avatarUrl: null,
    isRemovedFromSpace: true,
  };
}

function createLoadingUserViewDataFromLink(userLink) {
  return {
    isLoading: true,
    key: userLink.sys.id,
    label: null,
    avatarUrl: null,
    isRemovedFromSpace: null,
  };
}

function getUserLabel(user) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email;
}
