'use strict';

describe('DocumentPool', function () {
  beforeEach(function () {
    module('contentful/test');

    this.K = this.$inject('mocks/kefir');
    const Document = this.$inject('entityEditor/Document');
    this.doc = {
      destroy: sinon.stub(),
      state: {
        loaded$: this.K.createMockProperty(false)
      }
    };
    this.doc2 = {destroy: sinon.stub()};
    this.createDoc = Document.create = sinon.spy((_conn, entity) => {
      const s = entity.data.sys;
      return (s.id === 'id' && s.type === 'Entry') ? this.doc : this.doc2;
    });

    const createPool = this.$inject('data/sharejs/DocumentPool').create;
    this.conn = {};
    this.pool = createPool(this.conn);
  });

  describe('instance creation', function () {
    it('returns an object with pool API', function () {
      expect(
        Object.keys(this.pool).sort()
      ).toEqual(
        ['get', 'destroy', 'load'].sort()
      );
    });
  });

  const entity = {data: {sys: {id: 'id', type: 'Entry'}}};
  const entity2 = {data: {sys: {id: 'other', type: 'Entry'}}};
  const ct = {ct: true};
  const user = {user: true};

  describe('#get', function () {
    beforeEach(function () {
      this.get = function (id, type) {
        const entity = {data: {sys: {id: id, type: type || 'Entry'}}};
        return this.pool.get(entity, ct, user, this.K.createMockProperty());
      };
    });

    it('creates doc instance if never requested before', function () {
      const ref = this.get('id');
      expect(ref).toBe(this.doc);
      sinon.assert.calledWith(
        this.createDoc,
        this.conn,
        sinon.match((x) => dotty.get(x, 'data.sys.id', 'DOC')),
        ct,
        user
      );
    });

    it('uses previously requested doc instance', function () {
      const ref1 = this.get('id');
      const ref2 = this.get('id');
      expect(ref1).toBe(ref2);
      expect(ref1).toBe(this.doc);
      sinon.assert.calledOnce(this.createDoc);
    });

    it('does not mix docs for different entities', function () {
      const ref1 = this.get('id');
      const ref2 = this.get('other');
      expect(ref1).not.toBe(ref2);
      sinon.assert.calledTwice(this.createDoc);
    });

    it('does not mix docs for different types', function () {
      const ref1 = this.get('id', 'Entry');
      const ref2 = this.get('id', 'Asset');
      expect(ref1).not.toBe(ref2);
      sinon.assert.calledTwice(this.createDoc);
    });
  });

  describe('#load', function () {
    it('resolves when document emits loaded', function () {
      const load = this.pool.load(entity, ct, user, this.K.createMockProperty());
      const loaded = sinon.spy();
      load.then(loaded);
      this.$apply();
      sinon.assert.notCalled(loaded);

      this.doc.state.loaded$.set(true);
      this.doc.state.loaded$.end();
      this.$apply();
      sinon.assert.calledWith(loaded, this.doc);
    });
  });

  describe('disposing', function () {
    beforeEach(function () {
      this.lifeline1 = this.K.createMockStream();
      this.pool.get(entity, ct, user, this.lifeline1);
      this.lifeline2 = this.K.createMockStream();
      this.pool.get(entity, ct, user, this.lifeline2);
    });

    it('does not destroy a doc if there are references being used', function () {
      this.lifeline1.end();
      sinon.assert.notCalled(this.doc.destroy);
    });

    it('destroys a doc when the last refrence is disposed', function () {
      this.lifeline1.end();
      this.lifeline2.end();
      sinon.assert.calledOnce(this.doc.destroy);
    });
  });

  describe('#destroy', function () {
    it('destroys all document instances', function () {
      const lifeline = this.K.createMockStream();
      this.pool.get(entity, ct, user, lifeline);
      this.ref1 = this.pool.get(entity, ct, user, lifeline);
      this.ref2 = this.pool.get(entity2, ct, user, lifeline);
      this.pool.destroy();
      sinon.assert.calledOnce(this.doc.destroy);
      sinon.assert.calledOnce(this.doc2.destroy);
    });
  });
});
