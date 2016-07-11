'use strict';

describe('data/ShareJS/Connection', function () {
  let Kefir;

  beforeEach(function () {
    this.baseConnection = { socket: {}, emit: _.noop };
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
      sinon.assert.calledWithExactly(this.sharejs.Connection, '//HOST/channel', 'TOKEN');
    });
  });

  describe('#canOpen()', function () {
    it('returns "true" if state is ok', function () {
      const connection = this.create();
      expect(connection.canOpen()).toBe(false);

      this.baseConnection.state = 'connecting';
      expect(connection.canOpen()).toBe(true);

      this.baseConnection.state = 'handshaking';
      expect(connection.canOpen()).toBe(true);

      this.baseConnection.state = 'ok';
      expect(connection.canOpen()).toBe(true);

      this.baseConnection.state = 'disconnected';
      expect(connection.canOpen()).toBe(false);
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

  describe('#open()', function () {
    let entity, connection;

    beforeEach(function () {
      const space = {sys: {id: 'SID'}};
      const sys = {type: 'Entry', id: 'EID', space: space};
      entity = {data: {sys: sys}};
      connection = this.create();
      this.baseConnection.open = sinon.stub();
    });

    it('opens connection for entry', function () {
      connection.open(entity);

      sinon.assert.calledOnce(this.baseConnection.open);
      var entryKey = 'SID!entry!EID';
      sinon.assert.calledWith(this.baseConnection.open, entryKey, 'json');
    });

    it('opens connection for asset', function () {
      entity.data.sys.type = 'Asset';
      connection.open(entity);

      sinon.assert.calledOnce(this.baseConnection.open);
      const entryKey = 'SID!asset!EID';
      sinon.assert.calledWith(this.baseConnection.open, entryKey, 'json');
    });

    it('throws when entity type is invalid', function () {
      entity.data.sys.type = 'invalid';
      expect(() => {
        connection.open(entity);
      }).toThrow();
    });

    it('resolves promise through connection callback', function () {
      const success = sinon.stub();

      connection.open(entity).then(success);
      sinon.assert.notCalled(success);

      this.baseConnection.open.callArg(2);
      this.$apply();
      sinon.assert.calledOnce(success);
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
