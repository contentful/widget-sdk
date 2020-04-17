import { useReducer, useEffect } from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { openGenerateTokenDialog } from 'app/common/ApiTokens/GenerateCMATokenDialog';
import { Notification } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';
import { truncate } from 'utils/StringUtils';

const PER_PAGE = 10;

export const SELECT_PAGE = 'SELECT_PAGE';
export const FETCH_START = 'FETCH_START';
export const FETCH_SUCCESS = 'FETCH_SUCCESS';
export const FETCH_FAILURE = 'FETCH_FAILURE';
export const REMOVE_TOKEN = 'REMOVE_TOKEN';
export const ADD_TOKEN = 'ADD_TOKEN';

export const reducer = createImmerReducer({
  [FETCH_START]: (state) => {
    state.loadingTokens = true;
  },
  [FETCH_SUCCESS]: (state, { total, items, page }) => {
    const totalPages = Math.ceil(total / PER_PAGE);
    if (state.currentPage >= totalPages && totalPages > 0) {
      state.currentPage = totalPages - 1;
      return state;
    }
    state.currentPage = page;

    state.tokens = items.map((token) => ({
      id: token.sys.id,
      name: token.name,
    }));
    state.loadingTokens = false;
    state.totalPages = totalPages;
  },
  [FETCH_FAILURE]: (state) => {
    state.loadingTokens = false;
    state.loadingTokensError = true;
  },
  [SELECT_PAGE]: (state, { page }) => {
    state.currentPage = page;
  },
  [REMOVE_TOKEN]: (state, { id }) => {
    state.tokens = state.tokens.filter((token) => token.id !== id);
  },
  [ADD_TOKEN]: (state, { item }) => {
    state.tokens.push({
      id: item.sys.id,
      name: item.name,
    });
  },
});

export const useTokensState = (tokenResourceManager) => {
  const [state, dispatch] = useReducer(reducer, {
    loadingTokensError: false,
    loadingTokens: true,
    tokens: [],
    currentPage: 0,
    totalPages: 0,
  });

  const fetchTokens = async (page) => {
    dispatch({ type: FETCH_START, page });
    try {
      const { total, items } = await tokenResourceManager.fetch({
        skip: page * PER_PAGE,
        limit: PER_PAGE,
      });
      dispatch({ type: FETCH_SUCCESS, total, items, page });
    } catch (e) {
      dispatch({ type: FETCH_FAILURE });
    }
  };

  const Revoke = async (token) => {
    const id = token.id;
    try {
      await tokenResourceManager.revoke(id);
      dispatch({ type: REMOVE_TOKEN, id: token.id });
      track('personal_access_token:action', { action: 'revoke', patId: id });
      Notification.success(
        `The token “${escape(truncate(token.name, 30))}” has been successfully revoked.`
      );
    } catch (e) {
      Notification.error(
        'Revoking failed, please try again. If the problem persists, contact support.'
      );
    }
  };

  const OpenCreateDialog = () => {
    openGenerateTokenDialog(tokenResourceManager.create, (item) => {
      dispatch({ type: ADD_TOKEN, item: item });
    });
  };

  const SelectPage = async (page) => {
    dispatch({ type: SELECT_PAGE, page });
  };

  useEffect(() => {
    fetchTokens(state.currentPage);
  }, [state.currentPage]); // eslint-disable-line react-hooks/exhaustive-deps
  // top: effect should happen only when state.currentPage changes

  return [
    state,
    {
      Revoke,
      OpenCreateDialog,
      SelectPage,
    },
  ];
};
