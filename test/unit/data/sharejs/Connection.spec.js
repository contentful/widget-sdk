import * as K from 'helpers/mocks/kefir';

describe('data/sharejs/Connection', function () {
  beforeEach(function () {
    this.baseConnection = {
      socket: {},
      emit: _.noop,
      open: sinon.stub(),
      send: sinon.stub(),
      disconnect: sinon.stub(),
      setState: sinon.stub(),
      refreshAuth: sinon.stub()
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

    const OtDoc = this.$inject('mocks/OtDoc');
    this.resolveOpen = function () {
      const doc = new OtDoc();
      doc.close.yields();
      this.baseConnection.open.yield(null, doc);
      this.baseConnection.open.reset();
      this.$apply();
      return doc;
    };

    this.rejectOpen = function (err) {
      this.baseConnection.open.yield(err);
      this.baseConnection.open.reset();
      this.$apply();
    };

    const token$ = K.createMockProperty('TOKEN');
    const getToken = sinon.stub().resolves('TOKEN');
    this.refreshToken = sinon.stub().resolves('NEW_TOKEN');

    this.auth = {
      token$,
      getToken,
      refreshToken: () => this.refreshToken().then((t) => {
        token$.set(t);
        return t;
      })
    };

    this.create = this.$inject('data/sharejs/Connection').create;
    this.connection = this.create('//HOST', this.auth, 'SPACE', 'ENV');
  });

  afterEach(function () {
    this.connection.close();
  });

  describe('#create', function () {
    it('passes URL and getToken() to base connection', function () {
      sinon.assert.calledWith(
        this.sharejs.Connection,
        '//HOST/spaces/SPACE/channel',
        this.auth.getToken,
        'SPACE',
        'ENV'
      );
    });

    it('subscribes to auth token changes', function () {
      this.setState('ok');
      this.auth.token$.set('NEW_TOKEN');
      sinon.assert.calledWith(this.baseConnection.refreshAuth, 'NEW_TOKEN');
    });
  });

  describe('#getDocLoader()', function () {
    let DocLoad;

    beforeEach(function () {
      DocLoad = this.$inject('data/sharejs/Connection').DocLoad;

      this.entity = {
        data: {sys: {
          type: 'Entry',
          id: 'ENTITY',
          space: {sys: {id: 'SPACE'}}
        }}
      };

      const shouldOpen$ = K.createMockProperty(true);

      this.docLoader = this.connection.getDocLoader(this.entity, shouldOpen$);
      this.docValues = K.extractValues(this.docLoader.doc);
      this.$apply();

      this.setReadOnly = (val) => {
        shouldOpen$.set(!val);
      };
    });

    afterEach(function () {
      DocLoad = null;
    });

    it('emits pending when connecting', function () {
      this.setState('connecting');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Pending)
      );
    });

    it('opens a documented when is handshaking', function () {
      this.setState('handshaking');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Pending)
      );
      sinon.assert.calledOnce(this.baseConnection.open);
      sinon.assert.calledWith(this.baseConnection.open, 'SPACE!ENV!entry!ENTITY');
    });

    it('opens a documented when is ok', function () {
      this.setState('ok');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Pending)
      );
      sinon.assert.calledOnce(this.baseConnection.open);
      sinon.assert.calledWith(this.baseConnection.open, 'SPACE!ENV!entry!ENTITY');
    });

    it('does not reopen when moving from hanshaking to ok', function () {
      this.setState('ok');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Pending)
      );
      this.setState('handshaking');
      sinon.assert.calledOnce(this.baseConnection.open);
    });

    it('emits document when opening succeeds', function () {
      this.setState('ok');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Pending)
      );
      const doc = this.resolveOpen();
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        matchDocLoadDoc(doc)
      );
    });

    it('emits error when opening fails', function () {
      this.setState('ok');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Pending)
      );
      this.rejectOpen('ERROR');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        matchDocLoadError('ERROR')
      );
    });

    it('emits error when disconnected', function () {
      this.setState('ok');
      this.resolveOpen();
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        matchDocLoadDoc()
      );

      this.setState('disconnected');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        matchDocLoadError('disconnected')
      );
    });

    it('opens a document again after being disconnected', function () {
      this.setState('ok');
      this.resolveOpen();
      this.setState('disconnected');
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Error)
      );

      this.setState('ok');
      const doc = this.resolveOpen();
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        matchDocLoadDoc(doc)
      );
    });

    it('emits none if set to read-only mode', function () {
      this.setState('ok');
      this.resolveOpen();
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.Doc)
      );
      this.setReadOnly(true);
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        sinon.match.instanceOf(DocLoad.None)
      );
    });

    it('closes document when set to read-only mode', function () {
      this.setState('ok');
      const doc = this.resolveOpen();
      this.setReadOnly(true);
      sinon.assert.calledOnce(doc.close);
    });

    it('ends stream when loader is destroyed', function () {
      this.setState('ok');
      const ended = sinon.spy();
      this.docLoader.doc.onEnd(ended);
      this.docLoader.destroy();
      sinon.assert.calledOnce(ended);
    });

    it('closes document when loader is destroyed', function () {
      this.setState('ok');
      const doc = this.resolveOpen();
      K.assertMatchCurrentValue(
        this.docLoader.doc,
        matchDocLoadDoc(doc)
      );
      this.docLoader.destroy();
      this.$apply();
      sinon.assert.calledOnce(doc.close);
    });

    it('waits for closing to be acked before opening again', function () {
      this.setState('ok');
      const doc = this.resolveOpen();
      doc.close = sinon.stub();

      this.setReadOnly(true);
      sinon.assert.calledOnce(doc.close);

      this.setReadOnly(false);
      // waiting for `close()` call to finish:
      sinon.assert.notCalled(this.baseConnection.open);

      // open again when it's done:
      doc.close.yield();
      this.$apply();
      sinon.assert.calledOnce(this.baseConnection.open);
    });

    it('closes the doc once, even if called many times', function () {
      this.setState('ok');
      const doc = this.resolveOpen();

      // let's close the doc in various ways
      this.docLoader.close();
      this.setState(null);
      this.setReadOnly(true);

      sinon.assert.calledOnce(doc.close);
    });

    function matchDocLoadDoc (doc) {
      const matchDoc = doc ? sinon.match({doc}) : sinon.match.any;
      return sinon.match.instanceOf(DocLoad.Doc)
        .and(matchDoc);
    }

    function matchDocLoadError (error) {
      return sinon.match.instanceOf(DocLoad.Error)
        .and(sinon.match({error: error}));
    }
  });

  describe('#open()', function () {
    beforeEach(function () {
      const entity = {
        data: {sys: {
          type: 'Entry',
          id: 'ENTITY',
          space: {sys: {id: 'SPACE'}}
        }}
      };

      this.open = function () {
        return this.connection.open(entity);
      };
    });

    it('resolves to opened document', function* () {
      const open = this.open();

      this.setState('ok');
      const doc = this.resolveOpen();

      const opened = yield open;
      expect(opened.doc).toBe(doc);
    });

    it('it closes document when destroyed', function () {
      this.open().then(({destroy}) => destroy());

      this.setState('ok');
      const doc = this.resolveOpen();

      sinon.assert.called(doc.close);
    });
  });

  describe('#close()', function () {
    it('delegates to baseConnection.disconnect', function () {
      this.connection.close();
      sinon.assert.calledOnce(this.baseConnection.disconnect);
    });


    it('unsubscribes from auth token changes', function () {
      this.setState('ok');
      this.connection.close();
      this.auth.token$.set('NEW_TOKEN');
      sinon.assert.notCalled(this.baseConnection.refreshAuth);
    });
  });

  describe('#refreshAuth()', function () {
    beforeEach(function () {
      this.setState('ok');
    });

    it('calls connection.refreshAuth() with the new token', function* () {
      yield this.connection.refreshAuth();
      sinon.assert.calledOnce(this.baseConnection.refreshAuth.withArgs('NEW_TOKEN'));
    });

    it('does not call connection.refreshAuth() if connection is closed', function* () {
      this.setState('disconnected');
      yield this.connection.refreshAuth();
      sinon.assert.notCalled(this.baseConnection.refreshAuth);
    });

    it('prevents concurrent calls', function () {
      const firstCallPromise = this.connection.refreshAuth();
      const secondCallPromise = this.connection.refreshAuth();
      expect(firstCallPromise).toEqual(secondCallPromise);
    });

    it('makes a consequent call after previous one finishes', function* () {
      yield this.connection.refreshAuth();
      yield this.connection.refreshAuth();
      sinon.assert.calledTwice(this.baseConnection.refreshAuth);
    });

    it('closes connection if auth refresh failed', function* () {
      const error = new Error();
      this.baseConnection.refreshAuth.throws(error);

      yield this.connection.refreshAuth();
      sinon.assert.calledOnce(this.baseConnection.disconnect);
    });
  });
});
