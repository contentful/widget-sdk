import { uniqueId } from 'lodash';

export function createContentType({ sys = {}, name } = {}) {
  return {
    sys: {
      id: sys.id || uniqueId('content-type-id'),
      publishedVersion: sys.publishedVersion || 1
    },
    name: name || uniqueId('content-type-name')
  };
}
