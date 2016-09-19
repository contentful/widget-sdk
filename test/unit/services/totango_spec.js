'use strict';

describe('Totango service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.totango = this.$inject('totango');
    this.$window = this.$inject('$window');
    this.angularLoad = this.$inject('angularLoad');
    this.totangoStub = {
      go: sinon.stub(),
      track: sinon.stub()
    };

    sinon.stub(this.angularLoad, 'loadScript').returns(this.when().then(function () {
      _.merge(this.$window.totango, this.totangoStub);
    }.bind(this)));
  });

  afterEach(function () {
    delete this.$window.totango;
  });

  it('should enable', function* () {
    yield this.totango.enable();
    expect(this.$window.totango.go).toBe(this.totangoStub.go);
  });

  it('should disable', function* () {
    this.totango.disable();
    yield this.catchPromise(this.totango.enable());
    expect(this.$window.totango).toBe(undefined);
  });

  describe('when script loading fails', function () {
    beforeEach(function () {
      sinon.stub(this.totango._buffer, 'disable');
      this.angularLoad.loadScript.returns(this.reject());
    });

    it('should disable the buffer', function () {
      this.totango.enable();
      this.$apply();
      sinon.assert.called(this.totango._buffer.disable);
    });
  });

  it('buffers calls to totango and runs them when enabled', function () {
    this.totango.track('foo');
    this.totango.enable();
    this.$apply(); // Totango done loading
    expect(this.totangoStub.track.args[0][0]).toBe('foo');
    this.totango.track('bar');
    expect(this.totangoStub.track.args[1][0]).toBe('bar');
  });

  describe('after loading', function () {
    beforeEach(function () {
      this.totango.enable();
      this.$apply(); // Totango done loading
    });

    it('sets module names', function () {
      this.totango.setModule('API Keys');
      expect(this.$window.totango_options.module).toBe('API Keys');
    });
  });
});
