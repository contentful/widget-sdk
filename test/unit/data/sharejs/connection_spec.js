'use strict';

describe('data/ShareJS/Connection', function () {
  let Kefir;

  beforeEach(function () {
    this.baseConnection = {
      socket: {},
      emit: _.noop,
      open: sinon.stub()
    };

    this.setState = (state) => {
      this.baseConnection.state = state;
      this.baseConnection.emit();
      this.$apply();
    };

    this.yieldOpen = (err, doc) => {
      this.baseConnection.open.yield(err, doc);
      this.baseConnection.open.reset();
      this.$apply();
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
      this.setState('handshaking');

      this.docLoader = connection.getDocLoader(this.entity, this.readOnly);
      this.docValues = Kefir.extractValues(this.docLoader.doc);
      this.$apply();

      this.makeReadOnly = () => {
        this.readOnly.set(true);
        this.$apply();
      };
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
      this.yieldOpen(null, 'DOC');
      expect(this.docValues[0].doc).toBe('DOC');
    });

    it('emits error when opening fails', function () {
      this.yieldOpen('ERROR');
      expect(this.docValues[0].error).toBe('ERROR');
    });

    it('emits error when disconnected fails', function () {
      const doc = new OtDoc();
      this.yieldOpen(null, doc);
      expect(this.docValues[0].doc).toBe(doc);

      this.setState('disconnected');
      expect(this.docValues[0].error).toBe('disconnected');
    });

    it('opens a document again after being disconnected', function () {
      const doc = new OtDoc();
      this.yieldOpen(null, doc);

      this.setState(null);
      doc.close.yield();
      expect(this.docValues[0]).toBeInstanceOf(DocLoad.None);

      this.setState('ok');
      this.yieldOpen(null, 'DOC 2');
      expect(this.docValues[0].doc).toBe('DOC 2');
    });

    it('does not emit document when set to read-only mode', function () {
      this.yieldOpen(null, new OtDoc());
      this.makeReadOnly();
      expect(this.docValues[0]).toBeInstanceOf(DocLoad.None);
    });

    it('closes document when set to read-only mode', function () {
      const doc = new OtDoc();
      this.yieldOpen(null, doc);
      this.makeReadOnly();
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
      this.yieldOpen(null, doc);
      expect(this.docValues[0].doc).toBe(doc);
      this.docLoader.destroy();
      this.$apply();
      sinon.assert.calledOnce(doc.close);
    });

    it('waits for closing to be acked before opening again', function () {
      const doc = new OtDoc();
      this.yieldOpen(null, doc);

      this.docLoader.close();
      sinon.assert.calledOnce(doc.close);

      this.setState('ok');
      // waiting for `close()` call to finish:
      sinon.assert.notCalled(this.baseConnection.open);

      // open again when it's done:
      doc.close.yield();
      this.$apply();
      sinon.assert.calledOnce(this.baseConnection.open);
    });

    it('closes the doc once, even if called many times', function () {
      const doc = new OtDoc();
      this.yieldOpen(null, doc);

      // let's close the doc in various ways
      this.docLoader.close();
      this.setState(null);
      this.makeReadOnly();

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

      this.setState('handshaking');
      this.yieldOpen(null, doc);

      sinon.assert.calledWith(success, sinon.match({doc: doc}));
    });

    it('it closes document when destroyed', function () {
      const doc = new this.OtDoc();
      this.open().then(({destroy}) => destroy());

      this.setState('handshaking');
      this.yieldOpen(null, doc);

      sinon.assert.called(doc.close);
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
