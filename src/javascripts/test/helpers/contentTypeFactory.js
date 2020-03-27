import { uniqueId } from 'lodash';

export function createPublished({ sys = {}, name } = {}) {
  if (!sys.publishedVersion) {
    sys.publishedVersion = uniqueId();
  }

  return create({ sys, name });
}

export function createUpdated({ sys = {}, name } = {}) {
  if (!sys.publishedVersion) {
    sys.publishedVersion = uniqueId();
  }

  sys.version = sys.publishedVersion + 2;

  return create({ sys, name });
}

export function createDraft({ sys = {}, name } = {}) {
  if (sys.publishedVersion) {
    sys.publishedVersion = undefined;
  }

  return create({ sys, name });
}

export function create({ sys = {}, name } = {}) {
  return {
    sys: {
      ...sys,
      id: sys.id || uniqueId('content-type-id'),
      publishedVersion: sys.publishedVersion,
    },
    name: name || uniqueId('content-type-name'),
  };
}
