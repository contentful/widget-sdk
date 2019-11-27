export const user = {
  email: 'someone-from@contenful.com'
};

export const entityTitle = jest.fn();
export const entityDescription = jest.fn();
export const entryImage = jest.fn();

export const users = {
  get: jest.fn().mockResolvedValue({})
};

export const organization = {
  sys: {
    id: 'org'
  }
};

export const cma = {
  createExtension: jest.fn().mockResolvedValue({}),
  deleteExtension: jest.fn().mockResolvedValue({}),
  getExtensions: jest.fn().mockResolvedValue({ items: [] }),
  getExtension: jest.fn().mockResolvedValue({}),
  getEntries: jest.fn().mockResolvedValue({ items: [] }),
  getAssets: jest.fn().mockResolvedValue({ items: [] })
};

export const publishedCTs = {
  get: jest.fn(),
  getAllBare: jest.fn().mockReturnValue([])
};

export const widgets = {
  refresh: jest.fn().mockResolvedValue([])
};

export const contentPreview = {
  replaceVariablesInUrl: jest.fn(),
  getForContentType: jest.fn(),
  getSelected: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn()
};

export const getData = jest.fn();
export const getId = jest.fn();
export const getSpace = jest.fn();
export const hasOptedIntoAliases = jest.fn();

export const endpoint = jest.fn();

export const getEnvironmentId = jest.fn();

export const extensionLoader = {
  evictExtension: jest.fn(),
  getExtensionsById: jest.fn(),
  getAllExtensionsForListing: jest.fn()
};

export const space = {
  getId: jest.fn()
};
