import { stringify } from 'query-string';

export const withQueryParams = (path: string, params?: Record<string, unknown>) => {
  if (!params) {
    return path;
  }
  const paramsString = stringify(params);

  return paramsString ? `${path}?${paramsString}` : path;
};
