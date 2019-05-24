export const user = {
  email: 'someone-from@contenful.com'
};

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
  getExtension: jest.fn().mockResolvedValue({})
};

export const webhookRepo = {
  getAll: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue({}),
  logs: {
    getCall: jest.fn().mockResolvedValue({}),
    getHealth: jest.fn().mockResolvedValue({
      calls: {
        health: 50,
        total: 100
      }
    })
  }
};

export const publishedCTs = {
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

export const netlifyAppConfig = {
  get: jest.fn().mockResolvedValue({})
};

export const endpoint = jest.fn();

export const getEnvironmentId = jest.fn();
