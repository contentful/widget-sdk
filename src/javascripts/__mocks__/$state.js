import sinon from 'sinon';

export default {
  go: sinon.stub(),
  href: sinon.stub().callsFake(sref => `http://url-for-state-${sref}`)
};
