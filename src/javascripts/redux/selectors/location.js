import { get, flow } from 'lodash/fp';

const getLocation = get('location');

export default getLocation;

export const getQuery = flow(
  getLocation,
  get('search')
);

export const getPath = flow(
  getLocation,
  get('pathname')
);
