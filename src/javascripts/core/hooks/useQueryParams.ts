import { useMemo } from 'react';
import { getQueryString } from 'utils/location';

export function useQueryParams() {
  return useMemo(() => getQueryString(), []);
}
