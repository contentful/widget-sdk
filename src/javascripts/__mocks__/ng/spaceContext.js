export const user = {
  email: 'someone-from@contenful.com',
};

export const users = {
  get: jest.fn().mockResolvedValue({}),
};

export const organization = {
  sys: {
    id: 'org',
  },
  name: 'Contentful',
};

export const cma = {
  createExtension: jest.fn().mockResolvedValue({}),
  deleteExtension: jest.fn().mockResolvedValue({}),
  getExtensions: jest.fn().mockResolvedValue({ items: [] }),
  getExtension: jest.fn().mockResolvedValue({}),
  getEntries: jest.fn().mockResolvedValue({ items: [] }),
  getAssets: jest.fn().mockResolvedValue({ items: [] }),
};

export const publishedCTs = {
  get: jest.fn(),
  getAllBare: jest.fn().mockReturnValue([]),
  refresh: jest.fn(),
};

export const widgets = {
  refresh: jest.fn().mockResolvedValue([]),
};

export const contentPreview = {
  replaceVariablesInUrl: jest.fn(),
  getForContentType: jest.fn(),
  getSelected: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

export const getData = jest.fn();
export const getId = jest.fn();
export const hasOptedIntoAliases = jest.fn();

export const endpoint = jest.fn();

export const getEnvironmentId = jest.fn();

export const space = {
  getId: jest.fn(),
  endpoint: jest.fn(),
  data: {
    name: 'Blog',
    sys: {
      id: 'fg5eidi9k2qp',
    },
    organization,
    spaceMember: {
      admin: true,
    },
  },
};

export const getSpace = jest.fn().mockReturnValue(space);

export const memberships = {
  invite: jest.fn().mockResolvedValue({}),
};

export const isMasterEnvironment = jest.fn().mockReturnValue(true);
