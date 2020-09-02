import { useMemo, useState, useEffect } from 'react';
import { createSearchController } from './Controller';

export const useSearchController = ({
  fetchEntities,
  cache,
  listViewContext,
  getListQuery,
  paginator,
  keys,
}) => {
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const keysDep = JSON.stringify(keys);
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
    // Using keysDep instead of keys
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchEntities, getListQuery, keysDep, paginator, listViewContext, cache]
  );

  useEffect(() => {
    controller.updateEntities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasEntities = paginator.getTotal() > 0;
  const hasNoSearchResults = !hasEntities && !isLoading && controller.hasQuery();
  const showNoEntitiesAdvice = !hasEntities && !isLoading && !controller.hasQuery();

  return [
    { isLoading, entities, hasEntities, hasNoSearchResults, showNoEntitiesAdvice },
    { ...controller, setIsLoading },
  ];
};
