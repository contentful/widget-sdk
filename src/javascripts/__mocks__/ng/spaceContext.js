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

export const getData = jest.fn();
