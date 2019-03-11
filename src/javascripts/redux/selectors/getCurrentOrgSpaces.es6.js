import { get } from 'lodash';
import { getDatasets } from './datasets.es6';
import { ORG_SPACES } from '../datasets.es6';

export default function getCurrentOrgSpaces(state) {
  const datasets = getDatasets(state);
  return get(datasets, ORG_SPACES, {});
}
