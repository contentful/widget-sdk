import { useMemo } from 'react';
import Paginator from 'classes/Paginator';

export const usePaginator = (perPage: number) => {
  const paginator = useMemo(() => Paginator.create(perPage), [perPage]);

  return paginator;
};

// TODO can be Paginator.create once moved to TS
export type Paginator = ReturnType<typeof usePaginator>;
