import PropTypes from 'prop-types';

export const UserViewData = {
  key: PropTypes.string,
  fullName: PropTypes.string
};

export const UserSelectorViewData = {
  isLoading: PropTypes.bool,
  availableUsers: PropTypes.arrayOf(PropTypes.shape(UserViewData)),
  selectedUser: PropTypes.shape(UserViewData)
};

export function createSpaceUserSelectorViewData(usersFetchingStatus) {
  const { isLoading = true, data } = usersFetchingStatus;
  return {
    isLoading,
    availableUsers: (data || []).map(createUserViewData),
    selectedUser: null
  };
}

export function createUserViewDataFromLinkAndFetcher(userLink, usersFetchingStatus) {
  const { isLoading = true, data: users } = usersFetchingStatus;
  if (isLoading) {
    return createLoadingUserViewDataFromLink(userLink);
  }
  const user = users && users.find(user => user.sys.id === userLink.sys.id);
  return user ? createUserViewData(user) : createMissingUserViewDataFromLink(userLink);
}

function createUserViewData(user) {
  return {
    isLoading: false,
    key: user.sys.id,
    fullName: `${user.firstName} ${user.lastName}`,
    avatarUrl: user.avatarUrl,
    isRemovedFromSpace: false
  };
}

function createMissingUserViewDataFromLink(userLink) {
  return {
    isLoading: false,
    key: userLink.sys.id,
    fullName: null,
    avatarUrl: null,
    isRemovedFromSpace: true
  };
}

function createLoadingUserViewDataFromLink(userLink) {
  return {
    isLoading: true,
    key: userLink.sys.id,
    fullName: null,
    avatarUrl: null,
    isRemovedFromSpace: null
  };
}
