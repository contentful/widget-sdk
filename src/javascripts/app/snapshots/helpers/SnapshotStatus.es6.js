export function getProps(snapshot) {
  let label;
  let type;

  if (snapshot.sys.isCurrent) {
    label = 'current';
    type = 'secondary';
  } else if (snapshot.sys.snapshotType === 'publish') {
    label = 'published';
    type = 'positive';
  } else {
    label = 'other';
    type = 'warning';
  }

  return {
    children: label,
    tagType: type
  };
}
