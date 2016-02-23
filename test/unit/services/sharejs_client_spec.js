'use strict';

describe('ShareJS/Client', function () {
  var Client;

  beforeEach(function () {
    module('contentful/test');

    Client = this.$inject('ShareJS/Client');

    this.connection = { socket: {} };
    var $window = this.$inject('$window');
    $window.sharejs = {Connection: sinon.stub().returns(this.connection)};
  });

  afterEach(function () {
    var $window = this.$inject('$window');
    delete $window.sharejs;
  });

  describe('Client constructor', function () {

    it('creates a new connection', function () {
      var $window = this.$inject('$window');
      new Client();
      sinon.assert.calledOnce($window.sharejs.Connection);
    });

  });

  describe('#open()', function () {
    var entity, client;

    beforeEach(function () {
      var space = {sys: {id: 'SID'}};
      var sys = {type: 'Entry', id: 'EID', space: space};
      entity = {data: {sys: sys}};
      client = new Client();
      this.connection.open = sinon.stub();
    });

    it('opens connection for entry', function () {
      client.open(entity);

      sinon.assert.calledOnce(this.connection.open);
      var entryKey = 'SID!entry!EID';
      sinon.assert.calledWith(this.connection.open, entryKey, 'json');
    });

    it('opens connection for asset', function () {
      entity.data.sys.type = 'Asset';
      client.open(entity);

      sinon.assert.calledOnce(this.connection.open);
      var entryKey = 'SID!asset!EID';
      sinon.assert.calledWith(this.connection.open, entryKey, 'json');
    });

    it('throws when entity type is invalid', function () {
      entity.data.sys.type = 'invalid';
      expect(function () {
        client.open(entity);
      }).toThrow();
    });

    it('resolves promise through connection callback', function () {
      var success = sinon.stub();

      client.open(entity).then(success);
      sinon.assert.notCalled(success);

      this.connection.open.callArg(2);
      this.$apply();
      sinon.assert.calledOnce(success);
    });
  });
});
