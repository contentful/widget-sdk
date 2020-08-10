import { useMemo } from 'react';
import Paginator from 'classes/Paginator';

export const usePaginator = (perPage) => {
  const paginator = useMemo(() => Paginator.create(perPage), [perPage]);
  return paginator;
};
