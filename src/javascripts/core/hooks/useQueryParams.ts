import { useMemo } from 'react';
import { getQueryString } from 'utils/location';

/**
 *
 * @deprecated use useSearchParams from 'core/react-routing'
 */
export function useQueryParams() {
  return useMemo(() => getQueryString(), []);
}
