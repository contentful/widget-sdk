'use strict';

describe('GAPI Adapter', function() {
  var gapiAdapter, client, environment, $rootScope, $window;

  beforeEach(function() {
    client = jasmine.createSpyObj('gapi-client', ['setApiKey', 'request']);

    module('contentful/test');
    inject(function($injector){
      $rootScope   = $injector.get('$rootScope');
      $window      = $injector.get('$window');
      $window.gapi = {client: client};
      environment  = $injector.get('environment');
      gapiAdapter  = $injector.get('GAPIAdapter');
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  it('sets the Google API key', function(){
    expect(client.setApiKey).toHaveBeenCalledWith(environment.settings.google.gapi_key);
  });

  describe('#request', function() {
    describe('on successful execution', function() {
      it('resolves the promise with the items on the response', function() {
        var response;
        var items       = 'items';
        var requestMock = {execute: function(cb){ cb({items: items}); }};
        client.request  = function(){return requestMock;};

        gapiAdapter.request({}).then(function(_response_){ response = _response_; });
        $rootScope.$apply();

        expect(response).toBe(items);
      });
    });

    describe('on failed execution', function() {
      it('rejects the promise', function() {
        var spy         = jasmine.createSpy();
        var requestMock = {execute: function(cb){ cb({error: true}); }};
        client.request  = function(){return requestMock;};

        gapiAdapter.request({}).then(angular.noop, spy);
        $rootScope.$apply();

        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
