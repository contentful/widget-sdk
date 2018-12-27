export default {
  user: {
    email: 'someone-from@contenful.com'
  },
  users: {
    get: jest.fn().mockResolvedValue({})
  },
  cma: {
    createExtension: jest.fn().mockResolvedValue({}),
    deleteExtension: jest.fn().mockResolvedValue({}),
    getExtension: jest.fn().mockResolvedValue({})
  },
  webhookRepo: {
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
  },
  publishedCTs: {
    getAllBare: jest.fn().mockReturnValue([])
  },
  widgets: {
    refresh: jest.fn().mockResolvedValue([])
  },
  getData: jest.fn()
};
