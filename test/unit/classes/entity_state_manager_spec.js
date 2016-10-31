'use strict';

describe('StateManager class', function () {

  const entityURL = '/spaces/SID/entries/EID';

  beforeEach(function () {
    module('contentful/test');

    const cfStub = this.$inject('cfStub');

    const EntityStateManager = this.$inject('EntityStateManager');
    this.entity = cfStub.entry(cfStub.space('SID'), 'EID');
    this.manager = new EntityStateManager(this.entity);
    this.adapter = cfStub.adapter;
  });

  describe('#getState()', function () {
    it('returns "archived" when archived version is set', function () {
      this.entity.data.sys.archivedVersion = 1;
      expect(this.manager.getState()).toEqual('archived');
    });

    it('returns "published" when published version is set', function () {
      this.entity.data.sys.publishedVersion = 1;
      expect(this.manager.getState()).toEqual('published');
    });

    it('returns "draft" otherwise', function () {
      expect(this.manager.getState()).toEqual('draft');
    });
  });

  describe('#getEditingState()', function () {
    it('returns "archived" when archived version is set', function () {
      this.entity.data.sys.archivedVersion = 1;
      expect(this.manager.getEditingState()).toEqual('archived');
    });

    it('returns "published" when current version is published', function () {
      this.entity.data.sys.publishedVersion = 1;
      this.entity.data.sys.version = 2;
      expect(this.manager.getEditingState()).toEqual('published');
    });

    it('returns "changes" when current version is larger then published version', function () {
      this.entity.data.sys.publishedVersion = 1;
      this.entity.data.sys.version = 3;
      expect(this.manager.getEditingState()).toEqual('changes');
    });


    it('returns "draft" otherwise', function () {
      expect(this.manager.getEditingState()).toEqual('draft');
    });
  });

  describe('#archive()', function () {
    pit('send archive PUT request', function () {
      const archive = this.manager.archive();
      this.$apply();
      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/archived');
      expect(req.options.method).toEqual('PUT');

      req.resolve();
      return archive;
    });

    pit('unpublishes published entity first', function () {
      this.entity.data.sys.publishedVersion = 1;
      const archive = this.manager.archive();
      this.$apply();
      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/published');
      expect(req.options.method).toEqual('DELETE');

      req.resolve(_.merge({
        sys: {publishedVersion: null}
      }, this.entity.data));
      this.$apply();
      this.adapter.requests.pop().resolve();
      return archive;
    });

    it('triggers "changedEditingState" signal', function () {
      const listener = sinon.stub();
      this.manager.changedEditingState.attach(listener);
      this.manager.archive();
      this.$apply();

      this.adapter.requests.pop().resolve();
      this.entity.isArchived = sinon.stub.returns(true);
      this.$apply();

      sinon.assert.calledWith(listener, 'draft', 'archived');
    });
  });

  describe('#publish()', function () {
    pit('send publish PUT request', function () {
      const publish = this.manager.publish();
      this.$apply();
      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/published');
      expect(req.options.method).toEqual('PUT');

      req.resolve();
      return publish;
    });

    pit('unarchives archived entity first', function () {
      this.entity.data.sys.archivedVersion = 1;
      const publish = this.manager.publish();
      this.$apply();
      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/archived');
      expect(req.options.method).toEqual('DELETE');

      req.resolve(_.merge({
        sys: {archivedVersion: null}
      }, this.entity.data));
      this.$apply();
      this.adapter.requests.pop().resolve();
      return publish;
    });

    it('triggers "changedEditingState" signal', function () {
      const listener = sinon.stub();
      this.manager.changedEditingState.attach(listener);
      this.manager.publish();
      this.$apply();

      this.adapter.requests.pop().resolve(_.merge({
        sys: {archivedVersion: null, publishedVersion: 1}
      }, this.entity.data));
      this.$apply();

      sinon.assert.calledWith(listener, 'draft', 'published');
    });
  });

  describe('#toDraft()', function () {
    pit('unpublishes published entity', function () {
      this.entity.data.sys.publishedVersion = 1;
      const toDraft = this.manager.toDraft();
      this.$apply();

      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/published');
      expect(req.options.method).toEqual('DELETE');
      req.resolve();

      return toDraft;
    });

    pit('unarchives archived entity', function () {
      this.entity.data.sys.archivedVersion = 1;
      const toDraft = this.manager.toDraft();
      this.$apply();

      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/archived');
      expect(req.options.method).toEqual('DELETE');
      req.resolve();

      return toDraft;
    });

    pit('does nothing by default', function () {
      this.adapter.requests = [];
      const toDraft = this.manager.toDraft();
      this.$apply();

      expect(this.adapter.requests.length).toEqual(0);
      return toDraft;
    });
  });

  describe('#delete()', function () {
    pit('sends DELETE request', function () {
      const del = this.manager.delete();
      this.$apply();

      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL);
      expect(req.options.method).toEqual('DELETE');
      req.resolve();

      return del;
    });

    pit('unpublishes published entries', function () {
      this.entity.data.sys.publishedVersion = 1;

      const del = this.manager.delete();
      this.$apply();

      const req = this.adapter.requests.pop();
      expect(req.options.path).toEqual(entityURL + '/published');
      expect(req.options.method).toEqual('DELETE');
      req.resolve(this.entity.data);

      this.$apply();
      this.adapter.requests.pop().resolve();
      return del;
    });
  });
});
