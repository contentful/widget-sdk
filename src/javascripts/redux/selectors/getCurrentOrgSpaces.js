import { get } from 'lodash';
import { getDatasets } from './datasets';
import { ORG_SPACES } from '../datasets';

export default function getCurrentOrgSpaces(state) {
  const datasets = getDatasets(state);
  return get(datasets, ORG_SPACES, {});
}
