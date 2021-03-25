import qs from 'qs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setQueryParameters(queryParams: any) {
  const serializedParams = qs.stringify(queryParams);

  // The path name doesn't matter here, but the serialzied query params appearing after
  // does
  window.history.replaceState({}, 'Some path', `/?${serializedParams}`);
}
