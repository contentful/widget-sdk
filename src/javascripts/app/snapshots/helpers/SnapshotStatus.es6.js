const DEFAULT_PREFIX = 'entity-status--';

const STATES = {
  Published: 'published',
  Current: 'current',
  Other: 'other'
};

export function getLabel(snapshot) {
  if (snapshot.sys.isCurrent) {
    return STATES.Current;
  } else if (snapshot.sys.snapshotType === 'publish') {
    return STATES.Published;
  } else {
    return STATES.Other;
  }
}

export function getClassname(snapshot, prefix) {
  return (prefix || DEFAULT_PREFIX) + getLabel(snapshot);
}
