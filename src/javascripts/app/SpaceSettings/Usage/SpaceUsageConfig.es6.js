const baseSpacePath = ['spaces', 'detail'];
const settingsPath = [...baseSpacePath, 'settings'];

export const highlightedResources = [
  {
    id: 'entry',
    name: 'Entries',
    path: [...baseSpacePath, 'entries', 'list']
  },
  {
    id: 'asset',
    name: 'Media assets',
    path: [...baseSpacePath, 'assets', 'list']
  },
  {
    id: 'space_membership',
    name: 'Users',
    path: [...settingsPath, 'users', 'list']
  },
  {
    id: 'environment',
    name: 'Environments',
    path: [...settingsPath, 'environments']
  }
];
export const resourcesByPriority = [
  {
    id: 'content_type',
    name: 'Content types',
    path: [...baseSpacePath, 'content_types', 'list']
  },
  {
    id: 'locale',
    name: 'Locales',
    path: [...settingsPath, 'locales', 'list']
  },
  {
    id: 'role',
    name: 'Roles',
    path: [...settingsPath, 'roles', 'list']
  },
  {
    id: 'record',
    name: 'Records',
    description: 'Entries + Media'
  },
  {
    id: 'api_key',
    name: 'Api keys',
    path: [...baseSpacePath, 'api', 'keys', 'list']
  },
  {
    id: 'webhook_definition',
    name: 'Webhooks',
    path: [...settingsPath, 'webhooks', 'list']
  }
  // extension: 'Extensions'
];
