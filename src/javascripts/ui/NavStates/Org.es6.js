export function usage(orgId) {
  return {
    path: ['account', 'organizations', 'usage'],
    params: { orgId },
    options: { reload: true }
  };
}

export function memberships(orgId) {
  return {
    path: ['account', 'organizations', 'users'],
    params: { orgId },
    options: { reload: true }
  };
}

export function billing(orgId) {
  return {
    path: ['account', 'organizations', 'subscription_billing'],
    params: {
      orgId,
      pathSuffix: '/billing_address'
    },
    options: { reload: true }
  };
}

export function invoices(orgId) {
  return {
    path: ['account', 'organizations', 'billing'],
    params: { orgId },
    options: { reload: true }
  };
}

export function subscription(orgId, isLegacy = true) {
  return {
    path: ['account', 'organizations', isLegacy ? 'subscription' : 'subscription_new'],
    params: { orgId },
    options: { reload: true }
  };
}
