export function usage (orgId) {
  return {
    path: ['account', 'organizations', 'usage'],
    params: { orgId },
    options: { reload: true }
  };
}

export function memberships (orgId) {
  return {
    path: ['account', 'organizations', 'users'],
    params: { orgId },
    options: { reload: true }
  };
}

export function billing (orgId) {
  return {
    path: ['account', 'organizations', 'billing'],
    params: {orgId},
    options: { reload: true }
  };
}
