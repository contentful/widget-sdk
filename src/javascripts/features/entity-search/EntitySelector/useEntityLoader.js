import { useRef, useState, useMemo, useCallback } from 'react';
import { getModule } from 'core/NgRegistry';
import Paginator from 'classes/Paginator';
import { Operator } from 'core/services/ContentQuery';
import { id } from 'utils/Random';

export const ITEMS_PER_PAGE = 40;

/*
  Handles loading, pagination, errors for the entity selector.
*/
export const useEntityLoader = ({ entityType, fetch, contentTypeId }) => {
  const paginator = useRef(Paginator.create(ITEMS_PER_PAGE));
  const lastRequestId = useRef();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  const spaceContext = useMemo(() => getModule('spaceContext'), []);

  const load = useCallback(
    async (options) => {
      const requestId = id();
      lastRequestId.current = requestId;
      setLoading(true);

      const { reset = false, more = false, retry = false, search = {}, pageSize } = options || {};

      // to make sure we reset the page size to default if it was reduced with the
      // recovery retry logic after Response size to big error
      // otherwise we may end up with batchSize = 1 for the rest of the pages
      if (!retry || reset) {
        paginator.current.setPerPage(ITEMS_PER_PAGE);
      }

      if (reset) {
        paginator.current.setTotal(0);
        paginator.current.setPage(0);
      } else if (more) {
        paginator.current.next();
      }

      const batchSize = pageSize ?? paginator.current.getPerPage();

      if (pageSize > 0) {
        // Reduce the page size to avoid the "response is too big" error
        paginator.current.setPerPage(pageSize);
      }

      function getLoadedItems(res) {
        return res.items.reduce((acc, item) => {
          const id = item?.sys.id;
          const isAssetWithoutFile = item?.sys.type === 'Asset' && !item?.fields.file;
          if (id && !isAssetWithoutFile) {
            return [...acc, item];
          }
          return acc;
        }, []);
      }

      const getEmptyResponse = () => {
        return {
          data: [],
          hasMore: !paginator.current.isAtLast(),
          total: paginator.current.getTotal(),
        };
      };

      const getOrder = () => {
        const ct = contentTypeId && spaceContext.publishedCTs.get(contentTypeId);
        if (ct) {
          const displayField = ct.data.fields.find((field) => field.id === ct.data.displayField);
          if (displayField && displayField.type === 'Symbol' && displayField.id) {
            return { fieldId: displayField.id, direction: 'ascending' };
          }
        }
      };

      const params = {
        order: getOrder(),
        paginator: paginator.current,
        ...search,
      };

      if (entityType === 'Entry' && contentTypeId) {
        params.contentTypeId = contentTypeId;
      }

      if (entityType === 'Asset') {
        params.searchFilters = [
          ...(params.searchFilters || []),
          ['fields.file', Operator.EXISTS, true],
        ];
      }

      try {
        const res = await fetch(params);
        if (lastRequestId.current !== requestId) {
          return getEmptyResponse();
        }

        paginator.current.setTotal(res.total);
        const loadedItems = getLoadedItems(res);
        setError(undefined);
        setLoading(false);
        return {
          data: loadedItems,
          hasMore: !paginator.current.isAtLast(),
          total: res.total,
        };
      } catch (error) {
        if (lastRequestId.current !== requestId) {
          return getEmptyResponse();
        }

        // going one page back, because due to error this page stays empty
        // FYI, the page gets incremented at the beginning of the load function
        // if we wouldn't do that, we would end up with one empty page
        if (more) {
          paginator.current.prev();
        }

        if (
          error.status === 400 &&
          error?.data.message.toLowerCase().startsWith('response size too big') &&
          (!pageSize || batchSize > 1)
        ) {
          /**
           * Load items trying with smaller and smaller batches if "Response is too big" error occurs.
           * The current page pointer is adjusted respectively.
           */
          const halfTheBatchSize = Math.floor(batchSize / 2);
          return load({
            ...options,
            retry: true,
            pageSize: halfTheBatchSize,
          });
        }
        setError(error);
        setLoading(false);
        return getEmptyResponse();
      }
    },
    [entityType, fetch, contentTypeId, spaceContext]
  );

  const state = {
    error,
    isLoading,
  };

  return [state, load];
};
