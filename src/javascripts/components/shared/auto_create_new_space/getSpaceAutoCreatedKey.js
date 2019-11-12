export function getSpaceAutoCreatedKey(user, action) {
  const prefix = `ctfl:${user.sys.id}`;

  if (action === 'success') {
    return `${prefix}:spaceAutoCreated`;
  }
  return `${prefix}:spaceAutoCreationFailed`;
}
