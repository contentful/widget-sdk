import produce from 'immer';

const initialState = {};

export default produce((state, { type, payload }) => {
  switch (type) {
    case 'USER_UPDATE_FROM_TOKEN':
      state.user = payload.user;
      return;
    case 'ORGANIZATIONS_UPDATE_FROM_TOKEN':
      state.organization = payload.organization;
      return;
    case 'SPACES_BY_ORG_UPDATE_FROM_TOKEN':
      state.spaces = payload.spaces;
      return;
  }
}, initialState);
