import * as LazyLoader from 'utils/LazyLoader';

export async function init() {
  const osano = await LazyLoader.get('osano');

  return osano;
}
