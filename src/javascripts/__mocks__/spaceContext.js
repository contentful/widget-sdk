import sinon from 'sinon';

export default {
  cma: {
    createExtension: sinon.stub().resolves({}),
    deleteExtension: sinon.stub().resolves({}),
    getExtension: sinon.stub().resolves({})
  },
  webhookRepo: {
    getAll: sinon.stub().resolves([]),
    get: sinon.stub().resolves({}),
    logs: {
      getCall: sinon.stub().resolves({}),
      getHealth: sinon.stub().resolves({})
    }
  },
  publishedCTs: {
    getAllBare: sinon.stub().returns([])
  },
  widgets: {
    refresh: sinon.stub().resolves([])
  },
  getData: sinon.stub()
};
