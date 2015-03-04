'use strict';

describe('Segment service', function(){
  beforeEach(function(){
    module('contentful/test', function($provide){
      $provide.value('$document', [{
        createElement: sinon.stub().returns({}),
        location: {protocol: 'https:'},
        getElementsByTagName: sinon.stub().returns([{
          parentNode: {insertBefore: sinon.stub()}
        }])
      }]);
    });
    this.segment = this.$inject('segment');
    this.$window = this.$inject('$window');
    this.document = this.$inject('$document')[0];
  });

  afterEach(function(){
    delete this.$window.analytics;
  });

  it('should enable', function() {
    this.segment.enable();
    sinon.assert.called(this.document.createElement);
  });

  it('should disable', function(){
    this.segment.disable();
    this.segment.enable();
    sinon.assert.notCalled(this.document.createElement);
  });

  it('buffers calls to analytics and runs them when enabled', function(){
    this.document.createElement = sinon.spy(function(){
      this.$window.analytics.track = sinon.stub(); // Segment has loaded and installed `track`
      return {};
    }.bind(this));

    this.segment.track('foo');
    this.segment.enable(); // makes window.analytics, triggers load, resolves the buffer
    expect(this.$window.analytics.track.args[0][0]).toBe('foo');
    this.segment.track('bar');
    expect(this.$window.analytics.track.args[1][0]).toBe('bar');
  });
});
