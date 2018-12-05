'use strict';

import _ from 'lodash';

describe('Response Cache', () => {
  let cache, canStub;
  const entry = { sys: { id: 'eid', type: 'Entry' } };
  const asset = { sys: { id: 'aid', type: 'Asset' } };

  beforeEach(function() {
    module('contentful/test');
    cache = this.$inject('access_control/AccessChecker/ResponseCache.es6');
    canStub = sinon.stub().returns(true);
    cache.reset({ can: canStub });
  });

  function callTwice(action, entity) {
    cache.getResponse(action, entity);
    cache.getResponse(action, entity);
  }

  function callTwiceAssertOnce(action, entity) {
    callTwice(action, entity);
    sinon.assert.calledOnce(canStub.withArgs(action, entity));
  }

  it('Calls "can" when getting response for the first time', () => {
    cache.getResponse('create', 'Entry');
    sinon.assert.calledOnce(canStub.withArgs('create', 'Entry'));
  });

  it('Multiple calls are cached', () => {
    callTwiceAssertOnce('create', 'Entry');
  });

  it('Caches general permission checks', () => {
    callTwiceAssertOnce('create', 'Asset');
    callTwiceAssertOnce('read', 'Entry');
    callTwiceAssertOnce('publish', 'Entry');
  });

  it('Caches Entry permission checks', () => {
    callTwiceAssertOnce('read', entry);
    callTwiceAssertOnce('delete', entry);
    callTwiceAssertOnce('update', entry);
  });

  it('Caches separate permission checks for two different Entries', () => {
    const entry2 = _.clone(entry, true);
    entry2.sys.id = 'eid2';
    callTwice('read', entry);
    callTwice('read', entry2);
    sinon.assert.calledOnce(canStub.withArgs('read', entry));
    sinon.assert.calledOnce(canStub.withArgs('read', entry2));
  });

  it('Caches separate permission checks for two different general entities', () => {
    callTwice('read', 'Entry');
    callTwice('read', 'Settings');
    sinon.assert.calledOnce(canStub.withArgs('read', 'Entry'));
    sinon.assert.calledOnce(canStub.withArgs('read', 'Settings'));
  });

  it('Caches Asset permission checks', () => {
    callTwiceAssertOnce('read', asset);
    callTwiceAssertOnce('delete', asset);
    callTwiceAssertOnce('update', asset);
  });

  it('Caches separate permission checks for two different Assets', () => {
    const asset2 = _.clone(asset, true);
    asset.sys.id = 'aid2';
    callTwice('update', asset);
    callTwice('update', asset2);
    sinon.assert.calledOnce(canStub.withArgs('update', asset));
    sinon.assert.calledOnce(canStub.withArgs('update', asset2));
  });

  it('Does not cache when type is not given', () => {
    callTwice('read');
    callTwice('read', { sys: {} });
    sinon.assert.callCount(canStub, 4);
  });

  it('Does not cache when "can" does not return boolean', () => {
    canStub.returns(null);
    callTwice('read', 'Entry');
    sinon.assert.calledTwice(canStub.withArgs('read', 'Entry'));
  });
});
