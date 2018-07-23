import makeFetch from 'data/Request';
import {apiUrl} from 'Config';

/**
 * @description
 * Given a pair of authentication methods provided by the
 * 'Authentication' service return a function that fetches the
 * enforcements data.
 */
export default function makeFetchWithAuth (auth) {
  const fetch = makeFetch(auth);

  return (spaceId) => fetch({
    method: 'GET',
    url: apiUrl(`/spaces/${spaceId}/enforcements`)
  }).then(({data}) => data && data.items);
}
