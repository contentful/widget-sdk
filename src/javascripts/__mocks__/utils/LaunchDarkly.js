import sinon from 'sinon';

export const init = sinon.spy();

export const getCurrentVariation = sinon.stub().resolves(true);

export const onFeatureFlag = sinon.spy();

export const onABTest = sinon.spy();
