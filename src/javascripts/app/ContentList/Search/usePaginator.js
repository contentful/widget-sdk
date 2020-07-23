import { useMemo } from 'react';
import Paginator from 'classes/Paginator';

const usePaginator = (perPage) => {
  const paginator = useMemo(() => Paginator.create(perPage), [perPage]);
  return paginator;
};

export default usePaginator;
