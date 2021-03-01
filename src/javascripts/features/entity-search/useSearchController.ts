import { useMemo, useState, useEffect } from 'react';
import { createSearchController } from './Controller';
import type { ListViewContext } from './useListView';
import type { Paginator } from './usePaginator';
import type { Entity } from 'core/typings';

type EntityCache = Record<string, (...args: any[]) => any>;

type SearchControllerKeys = {
  search: string[];
  query: string[];
};

type SearchControllerCache = {
  entry: EntityCache;
  asset: EntityCache;
};

type SearchControllerParams = {
  listViewContext: ListViewContext;
  paginator: Paginator;
  keys: SearchControllerKeys;
  cache: SearchControllerCache;
  getListQuery: (opts: Record<string, any>) => Record<string, any>;
  fetchEntities: (query: Record<string, any>) => Entity;
};

export const useSearchController = (params: SearchControllerParams) => {
  const { listViewContext, paginator, fetchEntities, cache, getListQuery, keys } = params;
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const controller = useMemo(
    () =>
      createSearchController({
        cache,
        fetchEntities,
        getListQuery,
        keys,
        paginator,
        onUpdate: setEntities,
        onLoading: setIsLoading,
        listViewContext,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    void controller.updateEntities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasEntities = paginator.getTotal() > 0;
  const hasNoSearchResults = !hasEntities && !isLoading && controller.hasQuery();
  const showNoEntitiesAdvice = !hasEntities && !isLoading && !controller.hasQuery();

  return [
    { isLoading, entities, hasEntities, hasNoSearchResults, showNoEntitiesAdvice },
    { ...controller, setIsLoading },
  ];
};
