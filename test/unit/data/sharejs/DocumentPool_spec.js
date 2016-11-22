'use strict';

describe('DocumentPool', function () {
  beforeEach(function () {
    module('contentful/test');

    const Document = this.$inject('entityEditor/Document');
    this.doc = {destroy: sinon.stub()};
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
        ['get', 'dispose', 'destroy'].sort()
      );
    });
  });

  const entity = {data: {sys: {id: 'id', type: 'Entry'}}};
  const entity2 = {data: {sys: {id: 'other', type: 'Entry'}}};
  const ct = {ct: true};
  const user = {user: true};

  describe('#get', function () {
    it('creates doc instance if never requested before', function () {
      const ref = this.pool.get(entity, ct, user);
      expect(ref).toBe(this.doc);
      sinon.assert.calledOnce(
        this.createDoc.withArgs(this.conn, entity, ct, user)
      );
    });

    it('uses previously requested doc instance', function () {
      const ref1 = this.pool.get(entity, ct, user);
      const ref2 = this.pool.get(entity, ct, user);
      expect(ref1).toBe(ref2);
      expect(ref1).toBe(this.doc);
      sinon.assert.calledOnce(this.createDoc);
    });

    it('does not mix docs for different entities', function () {
      const ref1 = this.pool.get(entity, ct, user);
      const ref2 = this.pool.get(entity2, ct, user);
      expect(ref1).not.toBe(ref2);
      sinon.assert.calledTwice(this.createDoc);
    });

    it('does not mix docs for different types', function () {
      const asset = _.cloneDeep(entity);
      asset.data.sys.type = 'Asset';

      const ref1 = this.pool.get(entity, ct, user);
      const ref2 = this.pool.get(asset, ct, user);
      expect(ref1).not.toBe(ref2);
      sinon.assert.calledTwice(this.createDoc);
    });
  });

  describe('#dispose', function () {
    beforeEach(function () {
      this.ref1 = this.pool.get(entity, ct, user);
      this.ref2 = this.pool.get(entity, ct, user);
    });

    it('does not destroy a doc if there are references being used', function () {
      this.pool.dispose(this.ref2);
      sinon.assert.notCalled(this.doc.destroy);
    });

    it('destroys a doc when the last refrence is disposed', function () {
      this.pool.dispose(this.ref1);
      this.pool.dispose(this.ref2);
      sinon.assert.calledOnce(this.doc.destroy);
    });
  });

  describe('#destroy', function () {
    it('destroys all document instances', function () {
      this.pool.get(entity, ct, user);
      this.ref1 = this.pool.get(entity, ct, user);
      this.ref2 = this.pool.get(entity2, ct, user);
      this.pool.destroy();
      sinon.assert.calledOnce(this.doc.destroy);
      sinon.assert.calledOnce(this.doc2.destroy);
    });
  });
});
