'use strict';

describe('data/ShareJS/Connection', function () {
  let Kefir;

  beforeEach(function () {
    this.baseConnection = {
      socket: {},
      emit: _.noop,
      open: sinon.stub()
    };
    this.sharejs = {
      Connection: sinon.stub().returns(this.baseConnection)
    };

    module('contentful/test', ($provide) => {
      $provide.constant('libs/sharejs', this.sharejs);
    });

    Kefir = this.$inject('mocks/kefir');
    this.create = this.$inject('data/ShareJS/Connection').create;
  });

  describe('#create', function () {
    it('passes URL and token to base connection', function () {
      this.create('TOKEN', 'HOST', 'SPACE');
      sinon.assert.calledWithExactly(
        this.sharejs.Connection,
        '//HOST/spaces/SPACE/channel',
        'TOKEN'
      );
    });
  });

  describe('#getDocLoader()', function () {
    let DocLoad, OtDoc;

    beforeEach(function () {
      DocLoad = this.$inject('data/ShareJS/Connection').DocLoad;
      OtDoc = this.$inject('mocks/OtDoc');

      this.entity = {
        data: {sys: {
          type: 'Entry',
          id: 'ENTITY',
          space: {sys: {id: 'SPACE'}}
        }}
      };

      const connection = this.create('TOKEN', 'HOST', 'SPACE');
      this.readOnly = Kefir.createMockProperty(false);
      this.baseConnection.state = 'handshaking';
      this.baseConnection.emit();

      this.docLoader = connection.getDocLoader(this.entity, this.readOnly);
      this.docValues = Kefir.extractValues(this.docLoader.doc);
    });

    afterEach(function () {
      DocLoad = OtDoc = null;
    });

    it('is "None" initially', function () {
      expect(this.docValues[0]).toBeInstanceOf(DocLoad.None);
    });

    it('opens a documented when connection is handshaking', function () {
      sinon.assert.calledOnce(this.baseConnection.open);
      sinon.assert.calledWith(this.baseConnection.open, 'SPACE!entry!ENTITY');
    });

    it('emits document when opening succeeds', function () {
      this.baseConnection.open.yield(null, 'DOC');
      this.$apply();
      expect(this.docValues[0].doc).toBe('DOC');
    });

    it('emits error when opening fails', function () {
      this.baseConnection.open.yield('ERROR');
      this.$apply();
      expect(this.docValues[0].error).toBe('ERROR');
    });

    it('opens a document again after being disconnected', function () {
      this.baseConnection.open.yield(null, new OtDoc());
      this.$apply();

      this.baseConnection.state = null;
      this.baseConnection.emit();
      this.$apply();
      expect(this.docValues[0]).toBeInstanceOf(DocLoad.None);

      this.baseConnection.state = 'ok';
      this.baseConnection.emit();
      this.baseConnection.open.yield(null, 'DOC 2');
      this.$apply();
      expect(this.docValues[0].doc).toBe('DOC 2');
    });

    it('does not emit document when set to read-only mode', function () {
      this.baseConnection.open.yield(null, new OtDoc());
      this.readOnly.set(true);
      this.$apply();
      expect(this.docValues[0]).toBeInstanceOf(DocLoad.None);
    });

    it('closes document when set to read-only mode', function () {
      const doc = new OtDoc();
      this.baseConnection.open.yield(null, doc);
      this.readOnly.set(true);
      this.$apply();
      sinon.assert.calledOnce(doc.close);
    });

    it('ends stream when loader is destroyed', function () {
      const ended = sinon.spy();
      this.docLoader.doc.onEnd(ended);
      this.docLoader.destroy();
      sinon.assert.calledOnce(ended);
    });

    it('closes document when loader is destroyed', function () {
      const doc = new OtDoc();
      this.baseConnection.open.yield(null, doc);
      this.$apply();
      expect(this.docValues[0].doc).toBe(doc);
      this.docLoader.destroy();
      this.$apply();
      sinon.assert.calledOnce(doc.close);
    });
  });

  describe('#open()', function () {
    beforeEach(function () {
      this.OtDoc = this.$inject('mocks/OtDoc');

      const entity = {
        data: {sys: {
          type: 'Entry',
          id: 'ENTITY',
          space: {sys: {id: 'SPACE'}}
        }}
      };

      const connection = this.create('TOKEN', 'HOST', 'SPACE');

      this.open = function () {
        return connection.open(entity);
      };
    });

    it('resolves to opened document', function () {
      const doc = new this.OtDoc();
      const success = sinon.spy();
      this.open().then(success);

      this.baseConnection.state = 'handshaking';
      this.baseConnection.emit();
      this.baseConnection.open.yield(null, doc);
      this.$apply();

      sinon.assert.calledWith(success, sinon.match({doc: doc}));
    });

    it('it closes document when destroyed', function () {
      const doc = new this.OtDoc();
      this.open().then(({destroy}) => destroy());

      this.baseConnection.state = 'handshaking';
      this.baseConnection.emit();
      this.baseConnection.open.yield(null, doc);
      this.$apply();

      sinon.assert.called(doc.close);
    });
  });

  describe('#errors', function () {
    it('emits error events from base connection', function () {
      const connection = this.create();
      const errors = Kefir.extractValues(connection.errors);
      this.baseConnection.emit('error', 1);
      this.baseConnection.emit('error', 2);
      this.baseConnection.emit('error', 3);
      expect(errors).toEqual([3, 2, 1]);
    });
  });

  describe('#close', function () {
    it('delegates to baseConnection.disconnect', function () {
      const connection = this.create('URL', 'TOKEN');
      this.baseConnection.disconnect = sinon.spy();
      connection.close();
      sinon.assert.calledOnce(this.baseConnection.disconnect);
    });
  });
});
