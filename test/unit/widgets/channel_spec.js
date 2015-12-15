'use strict';

describe('widgets/channel', function () {
  beforeEach(function () {
    var self = this;
    self.addEventListener = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('$window', {addEventListener: self.addEventListener});
      $provide.value('modalDialog', null);
    });

    var Channel = this.$inject('widgets/channel');
    this.postMessage = sinon.stub();
    var iframe = {contentWindow: {postMessage: this.postMessage}};
    this.channel = new Channel(iframe);
  });

  it('#connect() sends connect message with id', function () {
    this.channel.connect();
    var id = this.channel.id;
    sinon.assert.calledWith(this.postMessage, {method: 'connect', params: {id: id}});
  });

  it('#connect() throws an error when called twice', function () {
    var connect = this.channel.connect.bind(this.channel);
    connect();
    expect(connect).toThrow();
  });

  it('#send() messages to the iframe', function () {
    this.channel.connect();
    this.channel.send('METHOD', 'PARAMS');
    sinon.assert.calledWith(this.postMessage, {method: 'METHOD', params: 'PARAMS'});
  });

  it('#send() queued messages after connecting', function () {
    this.channel.send('METHOD', 'PARAMS');
    this.channel.send('METHOD2', 'PARAMS');
    sinon.assert.notCalled(this.postMessage);
    this.channel.connect();
    sinon.assert.calledWith(this.postMessage, {method: 'METHOD', params: 'PARAMS'});
    sinon.assert.calledWith(this.postMessage, {method: 'METHOD2', params: 'PARAMS'});
  });

  it('calls handlers on message event', function () {
    var handler = sinon.stub();
    this.channel.handlers['MY_METHOD'] = handler;
    this.addEventListener.yield({
      data: {
        method: 'MY_METHOD',
        source: this.channel.id,
        params: ['A', 'B']
      }
    });
    sinon.assert.calledOnce(handler);
    sinon.assert.calledWith(handler, 'A', 'B');
  });

  it('does not call handlers when source id does not match', function () {
    var handler = sinon.stub();
    this.channel.handlers['MY_METHOD'] = handler;
    this.addEventListener.yield({
      data: {
        method: 'MY_METHOD',
        source: 'another id',
      }
    });
    sinon.assert.notCalled(handler);
  });


  it('sends result when handler returns a value', function () {
    var handler = sinon.stub().returns('RESULT');
    this.channel.handlers['MY_METHOD'] = handler;
    this.addEventListener.yield({
      data: {
        method: 'MY_METHOD',
        source: this.channel.id,
        id: 'CALL ID'
      }
    });
    sinon.assert.notCalled(this.postMessage);
    this.$apply();
    sinon.assert.calledWith(this.postMessage, {id: 'CALL ID', result: 'RESULT'});
  });

  it('sends result when handler promise is resolved', function () {
    var $q = this.$inject('$q');
    var result = $q.defer();
    var handler = sinon.stub().returns(result.promise);
    this.channel.handlers['MY_METHOD'] = handler;
    this.addEventListener.yield({
      data: {
        method: 'MY_METHOD',
        source: this.channel.id,
        id: 'CALL ID'
      }
    });
    sinon.assert.notCalled(this.postMessage);
    result.resolve('RESULT');
    this.$apply();
    sinon.assert.calledWith(this.postMessage, {id: 'CALL ID', result: 'RESULT'});
  });

  it('sends error when handler promise is rejected', function () {
    var $q = this.$inject('$q');
    var result = $q.defer();
    var handler = sinon.stub().returns(result.promise);
    this.channel.handlers['MY_METHOD'] = handler;
    this.addEventListener.yield({
      data: {
        method: 'MY_METHOD',
        source: this.channel.id,
        id: 'CALL ID'
      }
    });
    sinon.assert.notCalled(this.postMessage);
    result.reject({
      code: 'ECODE',
      message: 'EMESSAGE',
      data: 'EDATA'
    });
    this.$apply();
    sinon.assert.calledWith(this.postMessage, {
      id: 'CALL ID',
      error: {code: 'ECODE', message: 'EMESSAGE', data: 'EDATA'}
    });
  });
});
