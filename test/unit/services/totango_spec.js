'use strict';

describe('Totango service', function(){
  beforeEach(function(){
    module('contentful/test');
    this.totango = this.$inject('totango');
    this.$window = this.$inject('$window');
    this.angularLoad = this.$inject('angularLoad');
    this.totangoStub = {
      go: sinon.stub(),
      track: sinon.stub()
    };

    sinon.stub(this.angularLoad, 'loadScript').returns(this.when().then(function(){
      _.merge(this.$window.totango, this.totangoStub);
    }.bind(this)));
  });

  afterEach(function(){
    delete this.$window.totango;
  });

  it('should enable', function(done) {
    this.totango.enable().then(function(){
      expect(this.$window.totango.go).toBe(this.totangoStub.go);
      done();
    }.bind(this));
    this.$apply();
  });

  it('should disable', function(done){
    this.totango.disable();
    this.totango.enable().then(null, function(){
      expect(this.$window.totango).toBe(undefined);
      done();
    }.bind(this));
    this.$apply();
  });

  it('buffers calls to totango and runs them when enabled', function(){
    this.totango.track('foo');
    this.totango.enable();
    this.$apply(); // Totango done loading
    expect(this.totangoStub.track.args[0][0]).toBe('foo');
    this.totango.track('bar');
    expect(this.totangoStub.track.args[1][0]).toBe('bar');
  });

  describe('after loading', function() {
    beforeEach(function() {
      this.totango.enable();
      this.$apply(); // Totango done loading
    });

    it('sets module names', function(){
      this.totango.setModule('API Keys');
      expect(this.$window.totango_options.module).toBe('API Keys');
    });
  });
});
