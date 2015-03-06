'use strict';

describe('Bugsnag service', function(){
  beforeEach(function(){
    module('contentful/test');
    this.bugsnag = this.$inject('bugsnag');
    this.$window = this.$inject('$window');
    this.angularLoad = this.$inject('angularLoad');
    this.BugsnagStub = {
      notify: sinon.stub(),
      notifyException: sinon.stub(),
      refresh: sinon.stub()
    };

    this.angularLoad.loadScript = sinon.stub().returns(this.when().then(function(){
      this.$window.Bugsnag = this.BugsnagStub;
    }.bind(this)));
  });

  afterEach(function(){
    delete this.$window.Bugsnag;
  });

  it('should enable', function(done) {
    this.bugsnag.enable().then(function(){
      expect(this.$window.Bugsnag).toBe(this.BugsnagStub);
      done();
    }.bind(this));
    this.$apply();
  });

  it('should disable', function(done){
    this.bugsnag.disable();
    this.bugsnag.enable().then(null, function(){
      expect(this.$window.Bugsnag).toBe(undefined);
      done();
    }.bind(this));
    this.$apply();
  });

  describe('when script loading fails', function(){
    beforeEach(function(){
      sinon.stub(this.bugsnag._buffer, 'disable');
      this.angularLoad.loadScript.returns(this.reject());
    });

    it('should disable the buffer', function(){
      this.bugsnag.enable();
      this.$apply();
      sinon.assert.called(this.bugsnag._buffer.disable);
    });
  });

  it('buffers calls to bugsnag and runs them when enabled', function(){
    this.bugsnag.notify('foo');
    this.bugsnag.enable();
    this.$apply(); // Bugsnag done loading
    expect(this.$window.Bugsnag.notify.args[0][0]).toBe('foo');
    this.bugsnag.notify('bar');
    expect(this.$window.Bugsnag.notify.args[1][0]).toBe('bar');
  });

  describe('needsUser', function(){
    it('should return false when bugsnag is not loaded', function() {
      expect(this.bugsnag.needsUser()).toBe(false);
      this.bugsnag.disable();
      this.$apply();
      expect(this.bugsnag.needsUser()).toBe(false);
    });

    it('should return true when bugsnag has loaded and no user yet', function(){
      this.bugsnag.enable();
      this.$apply();
      expect(this.bugsnag.needsUser()).toBe(true);
    });

    it('should return false when bugsnag has loaded and a user', function(){
      this.bugsnag.setUser({name: 'Foo'});
      this.bugsnag.enable();
      this.$apply();
      expect(this.bugsnag.needsUser()).toBe(false);
    });
  });
});
