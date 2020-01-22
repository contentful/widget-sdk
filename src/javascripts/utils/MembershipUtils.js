export const orgRoles = [
  {
    name: 'Member',
    value: 'member',
    description: 'Can only access spaces and teams they are added to'
  },
  {
    name: 'Developer',
    value: 'developer',
    description:
      'Can access spaces and teams they are added to and manage organizational development entities'
  },
  {
    name: 'Admin',
    value: 'admin',
    description: 'Can manage everything except billing and subscription'
  },
  {
    name: 'Owner',
    value: 'owner',
    description: 'Can manage everything'
  }
];

export function getRoleDescription(role) {
  const orgRole = orgRoles.find(orgRole => orgRole.value === role);

  if (!orgRole) {
    return '';
  }

  return orgRole.description;
}
