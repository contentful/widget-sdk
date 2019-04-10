import { useReducer } from 'react';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { getAll } from 'data/CMA/CommentsRepo.es6';

const FETCH_INIT = 'FETCH_INIT';
const FETCH_SUCCESS = 'FETCH_SUCCESS';
const FETCH_FAILURE = 'FETCH_FAILURE';

const dataFetchReducer = (_, action) => {
  switch (action.type) {
    case FETCH_INIT:
      return { isLoading: true, isError: false };
    case FETCH_SUCCESS:
      return { isLoading: false, isError: false, data: action.payload };
    case FETCH_FAILURE:
      return { isLoading: false, isError: true, error: action.error };
  }
};

const initialFetchState = {
  isLoading: false,
  isError: false
};

export const useCommentsFetcher = (spaceId, entryId) => {
  const endpoint = createSpaceEndpoint(spaceId);
  const [state, dispatch] = useReducer(dataFetchReducer, initialFetchState);

  const fetch = async () => {
    dispatch({ type: FETCH_INIT });

    try {
      const data = await getAll(endpoint, entryId);
      dispatch({ type: FETCH_SUCCESS, payload: data });
    } catch (error) {
      dispatch({ type: FETCH_FAILURE, error });
    }
  };

  return [state, fetch];
};
