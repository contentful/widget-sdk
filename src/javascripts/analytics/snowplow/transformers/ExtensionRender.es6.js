import { pick } from 'lodash';

export const EXPECTED_EVENT_PROPS = [
  'location',
  'extension_id',
  'extension_name',
  'src',
  'installation_params',
  'instance_params'
];

export default function(_, segmentData) {
  return {
    // Remove properties automatically added by Segment client.
    data: pick(segmentData, EXPECTED_EVENT_PROPS)
  };
}
