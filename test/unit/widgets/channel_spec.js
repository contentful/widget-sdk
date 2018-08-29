'use strict';

describe('widgets/channel', () => {
  beforeEach(function() {
    const addEventListener = sinon.stub();
    module('contentful/test', $provide => {
      $provide.value('$window', {
        addEventListener,
        removeEventListener: sinon.stub()
      });
      $provide.value('modalDialog', null);
    });

    const Channel = this.$inject('widgets/channel');
    this.postMessage = sinon.stub();
    const iframe = { contentWindow: { postMessage: this.postMessage } };
    this.channel = new Channel(iframe);

    this.receiveMessage = function(data) {
      if (!data.source) {
        data.source = this.channel.id;
      }

      addEventListener.withArgs('message').yield({ data });
    };
  });

  describe('#connect()', () => {
    it('sends connect message with id', function() {
      this.channel.connect();
      const id = this.channel.id;
      sinon.assert.calledWith(this.postMessage, {
        method: 'connect',
        params: [{ id: id }, []]
      });
    });

    it('throws an error when called twice', function() {
      const connect = this.channel.connect.bind(this.channel);
      connect();
      expect(connect).toThrow();
    });
  });

  describe('#send()', () => {
    const PARAMS = ['PARAM'];

    it('messages to the iframe', function() {
      this.channel.connect();
      this.channel.send('METHOD', PARAMS);
      sinon.assert.calledWith(this.postMessage, { method: 'METHOD', params: PARAMS });
    });

    it('queued messages after connecting', function() {
      this.channel.send('METHOD1', ['PARAM1']);
      this.channel.send('METHOD2', ['PARAM2']);
      sinon.assert.notCalled(this.postMessage);
      this.channel.connect();
      const id = this.channel.id;
      const queued = [
        { method: 'METHOD1', params: ['PARAM1'] },
        { method: 'METHOD2', params: ['PARAM2'] }
      ];
      sinon.assert.calledWith(this.postMessage, {
        method: 'connect',
        params: [{ id: id }, queued]
      });
    });

    it('throws an error if params is not an array', function() {
      const send = this.channel.send.bind(this.channel, 'METHOD', 'NOT-AN-ARRAY');
      this.channel.connect();
      expect(send).toThrow();
    });
  });

  describe('on message', () => {
    it('calls handlers on message event', function() {
      const handler = sinon.stub();
      this.channel.handlers['MY_METHOD'] = handler;
      this.receiveMessage({
        method: 'MY_METHOD',
        params: ['A', 'B']
      });
      sinon.assert.calledOnce(handler);
      sinon.assert.calledWith(handler, 'A', 'B');
    });

    it('does not call handlers when source id does not match', function() {
      const handler = sinon.stub();
      this.channel.handlers['MY_METHOD'] = handler;
      this.receiveMessage({ method: 'MY_METHOD', source: 'another id' });
      sinon.assert.notCalled(handler);
    });

    it('sends result when handler returns a value', function() {
      const handler = sinon.stub().returns('RESULT');
      this.channel.handlers['MY_METHOD'] = handler;
      sinon.assert.notCalled(this.postMessage);
      this.receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      sinon.assert.calledWith(this.postMessage, { id: 'CALL ID', result: 'RESULT' });
    });

    it('sends result when handler promise is resolved', function() {
      const handler = sinon.stub().defers();
      this.channel.handlers['MY_METHOD'] = handler;
      this.receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      sinon.assert.notCalled(this.postMessage);
      handler.resolve('RESULT');
      this.$apply();
      sinon.assert.calledWith(this.postMessage, { id: 'CALL ID', result: 'RESULT' });
    });

    it('does not send result when channel is destroyed', function() {
      const handler = sinon.stub().defers();
      this.channel.handlers['MY_METHOD'] = handler;
      this.receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      this.channel.destroy();
      handler.resolve();
      this.$apply();
      sinon.assert.notCalled(this.postMessage);
    });

    it('sends error when handler promise is rejected', function() {
      const handler = sinon.stub().defers();
      this.channel.handlers['MY_METHOD'] = handler;
      this.receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      sinon.assert.notCalled(this.postMessage);
      handler.reject({
        code: 'ECODE',
        message: 'EMESSAGE',
        data: 'EDATA'
      });
      this.$apply();
      sinon.assert.calledWith(this.postMessage, {
        id: 'CALL ID',
        error: { code: 'ECODE', message: 'EMESSAGE', data: 'EDATA' }
      });
    });
  });
});
