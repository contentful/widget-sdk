import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import _ from 'lodash';
import { $initialize, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';
import createOtDocMock from 'test/helpers/mocks/ot_doc';

const OtDocMock = createOtDocMock();

describe('data/sharejs/Connection', () => {
  beforeEach(async function() {
    this.baseConnection = {
      socket: {},
      emit: _.noop,
      open: sinon.stub(),
      send: sinon.stub(),
      disconnect: sinon.stub(),
      setState: sinon.stub(),
      state: 'disconnected',
      refreshAuth: sinon.stub()
    };

    this.setState = state => {
      this.baseConnection.state = state;
      this.baseConnection.emit();
      $apply();
    };

    this.yieldOpen = (err, doc) => {
      this.baseConnection.open.yield(err, doc);
      this.baseConnection.open.reset();
      $apply();
    };

    this.sharejs = {
      Connection: sinon.stub().returns(this.baseConnection)
    };

    this.system.set('@contentful/sharejs/lib/client', {
      default: this.sharejs
    });

    this.ShareJSConnection = await this.system.import('data/sharejs/Connection');

    await $initialize(this.system);

    this.resolveOpen = function() {
      const doc = new OtDocMock();
      doc.close.yields();
      this.baseConnection.open.yield(null, doc);
      this.baseConnection.open.reset();
      $apply();
      return doc;
    };

    this.rejectOpen = function(err) {
      this.baseConnection.open.yield(err);
      this.baseConnection.open.reset();
      $apply();
    };

    const token$ = K.createMockProperty('TOKEN');
    const getToken = sinon.stub().resolves('TOKEN');
    this.refreshToken = sinon.stub().resolves('NEW_TOKEN');

    this.auth = {
      token$,
      getToken,
      refreshToken: () =>
        this.refreshToken().then(t => {
          token$.set(t);
          return t;
        })
    };

    this.create = this.ShareJSConnection.create;
    this.connection = this.create('//HOST', this.auth, 'SPACE', 'ENV');
  });

  afterEach(function() {
    this.connection.close();
  });

  describe('#create', () => {
    it('passes URL and getToken() to base connection', function() {
      sinon.assert.calledWith(
        this.sharejs.Connection,
        '//HOST/spaces/SPACE/channel',
        this.auth.getToken,
        'SPACE',
        'ENV'
      );
    });

    it('subscribes to auth token changes', function() {
      this.setState('ok');
      this.auth.token$.set('NEW_TOKEN');
      sinon.assert.calledWith(this.baseConnection.refreshAuth, 'NEW_TOKEN');
    });
  });

  describe('#getDocLoader()', () => {
    let DocLoad;

    beforeEach(function() {
      DocLoad = this.ShareJSConnection.DocLoad;

      this.entity = {
        data: {
          sys: {
            type: 'Entry',
            id: 'ENTITY',
            space: { sys: { id: 'SPACE' } }
          }
        }
      };

      const shouldOpen$ = K.createMockProperty(true);

      this.getDocLoader = () => {
        const docLoader = this.connection.getDocLoader(this.entity, shouldOpen$);
        // We only request to open a document if we subscribe to the
        // `doc` property.
        K.onValue(docLoader.doc, () => {});
        $apply();
        return docLoader;
      };

      this.setReadOnly = val => {
        shouldOpen$.set(!val);
      };

      // Returns a `{ docLoader, doc }` pair where the doc loader is in
      // the opened state and provides the `doc`.
      this.openDoc = () => {
        this.setState('ok');
        const docLoader = this.getDocLoader();
        const doc = this.resolveOpen();

        expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Doc);
        expect(K.getValue(docLoader.doc).doc).toBe(doc);

        return { docLoader, doc };
      };
    });

    afterEach(() => {
      DocLoad = null;
    });

    it('emits "DocLoad.Pending" when connecting', function() {
      this.setState('disconnected');
      const doc$ = this.getDocLoader().doc;
      this.setState('connecting');
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Pending);
    });

    it('emits "DocLoad.Pending" when connection is pending is handshaking', function() {
      this.setState('disconnected');
      const doc$ = this.getDocLoader().doc;
      this.setState('handshaking');
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Pending);
    });

    it('opens a "DocLoad.Doc" when is connection state becomes "ok"', function() {
      this.setState('disconnected');
      const doc$ = this.getDocLoader().doc;
      this.setState('handshaking');
      this.setState('ok');
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Pending);
      sinon.assert.calledOnce(this.baseConnection.open);
      sinon.assert.calledWith(this.baseConnection.open, 'SPACE!ENV!entry!ENTITY');

      const doc = this.resolveOpen();
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Doc);
      expect(K.getValue(doc$).doc).toBe(doc);
    });

    it('emits "DocLoad.Doc" when opening succeeds', function() {
      this.setState('ok');
      const doc$ = this.getDocLoader().doc;
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Pending);

      const doc = this.resolveOpen();
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Doc);
      expect(K.getValue(doc$).doc).toBe(doc);
    });

    it('emits "DocLoad.Error" when opening fails', function() {
      this.setState('ok');
      const doc$ = this.getDocLoader().doc;
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Pending);

      this.rejectOpen('ERROR');
      expect(K.getValue(doc$)).toBeInstanceOf(DocLoad.Error);
      expect(K.getValue(doc$).error).toBe('ERROR');
    });

    it('emits "DocLoad.Error" when disconnected', function() {
      const { docLoader } = this.openDoc();

      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Doc);

      this.setState('disconnected');
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Error);
      expect(K.getValue(docLoader.doc).error).toBe('disconnected');
    });

    it('re-opens a document again after being disconnected', function() {
      const { docLoader } = this.openDoc();

      this.setState('disconnected');
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Error);

      this.setState('ok');
      const doc = this.resolveOpen();
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Doc);
      expect(K.getValue(docLoader.doc).doc).toBe(doc);
    });

    it('emits "DocLoad.None" if set to read-only mode', function() {
      const { docLoader } = this.openDoc();

      this.setReadOnly(true);
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.None);
    });

    it('closes document when set to read-only mode', function() {
      const { docLoader, doc } = this.openDoc();

      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Doc);
      this.setReadOnly(true);
      sinon.assert.calledOnce(doc.close);
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.None);
    });

    it('ends stream when loader is destroyed', function() {
      const { docLoader } = this.openDoc();

      const ended = sinon.spy();
      docLoader.doc.onEnd(ended);
      docLoader.destroy();
      $apply();
      sinon.assert.calledOnce(ended);
    });

    it('closes document when loader is destroyed', function() {
      const { docLoader, doc } = this.openDoc();
      docLoader.destroy();
      $apply();
      sinon.assert.calledOnce(doc.close);
    });

    it('waits for closing to be acked before opening again from same loader', function() {
      const { docLoader, doc } = this.openDoc();
      doc.close = sinon.stub();

      this.setReadOnly(true);
      sinon.assert.calledOnce(doc.close);
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.None);

      this.setReadOnly(false);
      // waiting for `close()` call to finish:
      sinon.assert.notCalled(this.baseConnection.open);
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Pending);

      // open again when it's done:
      doc.close.yield();
      $apply();
      expect(K.getValue(docLoader.doc)).toBeInstanceOf(DocLoad.Pending);
      sinon.assert.calledOnce(this.baseConnection.open);
    });

    it('waits for closing to be acked before opening again from different loader', function() {
      // Open doc from first loader and initiate close
      const { docLoader, doc } = this.openDoc();
      doc.close = sinon.stub();
      this.baseConnection.open.reset();
      docLoader.destroy();

      const otherDocLoader = this.getDocLoader();
      // waiting for `close()` call to finish:
      sinon.assert.notCalled(this.baseConnection.open);
      expect(K.getValue(otherDocLoader.doc)).toBeInstanceOf(DocLoad.Pending);

      // Close has finished. Ready to open same doc again.
      doc.close.yield();
      $apply();
      sinon.assert.calledOnce(this.baseConnection.open);

      this.resolveOpen();
      expect(K.getValue(otherDocLoader.doc)).toBeInstanceOf(DocLoad.Doc);
    });

    it('reapply pending ops if the connection was closed', function() {
      const { doc } = this.openDoc();

      const op1 = [{ p: [] }];
      doc.pendingOp = op1;
      const op2 = [{ p: [] }];
      doc.inflightOp = op2;

      doc.close.yields();
      this.setState('disconnected');
      this.setState('ok');
      const doc2 = this.resolveOpen();
      sinon.assert.calledWith(doc2.submitOp, op1);
      sinon.assert.calledWith(doc2.submitOp, op2);
    });
  });

  describe('#open()', () => {
    beforeEach(function() {
      const entity = {
        data: {
          sys: {
            type: 'Entry',
            id: 'ENTITY',
            space: { sys: { id: 'SPACE' } }
          }
        }
      };

      this.open = function() {
        this.setState('connecting');
        return this.connection.open(entity);
      };
    });

    it('resolves to opened document', async function() {
      const open = this.open();

      this.setState('ok');
      const doc = this.resolveOpen();

      const opened = await open;
      expect(opened.doc).toBe(doc);
    });

    it('it closes document when destroyed', function() {
      this.open().then(({ destroy }) => destroy());

      this.setState('ok');
      const doc = this.resolveOpen();

      sinon.assert.called(doc.close);
    });
  });

  describe('#close()', () => {
    it('delegates to baseConnection.disconnect', function() {
      this.connection.close();
      sinon.assert.calledOnce(this.baseConnection.disconnect);
    });

    it('unsubscribes from auth token changes', function() {
      this.setState('ok');
      this.connection.close();
      this.auth.token$.set('NEW_TOKEN');
      sinon.assert.notCalled(this.baseConnection.refreshAuth);
    });
  });

  describe('#refreshAuth()', () => {
    beforeEach(function() {
      this.setState('ok');
    });

    it('calls connection.refreshAuth() with the new token', async function() {
      await this.connection.refreshAuth();
      sinon.assert.calledOnce(this.baseConnection.refreshAuth.withArgs('NEW_TOKEN'));
    });

    it('does not call connection.refreshAuth() if connection is closed', async function() {
      this.setState('disconnected');
      await this.connection.refreshAuth();
      sinon.assert.notCalled(this.baseConnection.refreshAuth);
    });

    it('prevents concurrent calls', function() {
      const firstCallPromise = this.connection.refreshAuth();
      const secondCallPromise = this.connection.refreshAuth();
      expect(firstCallPromise).toEqual(secondCallPromise);
    });

    it('makes a consequent call after previous one finishes', async function() {
      await this.connection.refreshAuth();
      await this.connection.refreshAuth();
      sinon.assert.calledTwice(this.baseConnection.refreshAuth);
    });

    it('closes connection if auth refresh failed', async function() {
      const error = new Error();
      this.baseConnection.refreshAuth.throws(error);

      await this.connection.refreshAuth();
      sinon.assert.calledOnce(this.baseConnection.disconnect);
    });
  });
});
