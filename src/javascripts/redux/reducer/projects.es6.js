import produce from 'immer';
import { set } from 'lodash';
import * as actions from 'redux/actions/projects/actions.es6';

export default produce((state, action) => {
  switch (action.type) {
    case actions.GET_ALL_PROJECTS_PENDING:
      set(state, [action.meta.orgId, 'isPending'], true);

      return;
    case actions.GET_ALL_PROJECTS_SUCCESS:
      set(state, [action.meta.orgId, 'items'], action.payload);
      set(state, [action.meta.orgId, 'isPending'], false);

      return;
    case actions.GET_ALL_PROJECTS_FAILURE:
      set(state, [action.meta.orgId, 'error'], action.payload);
      set(state, [action.meta.orgId, 'isPending'], false);

      return;
  }
}, {});
