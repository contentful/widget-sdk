'use strict';

describe('Oyaala Client', function () {
  var ooyalaClient;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector){
      ooyalaClient = $injector.get('ooyalaClient');
    });
  });

  describe('#request', function() {
    it('uses the client adapter to execute a API request', function() {
      spyOn(ooyalaClient.clientAdapter, 'request');

      ooyalaClient.request('POST', '/integrations/ooyala/v2/players', 'random stuff');

      expect(ooyalaClient.clientAdapter.request).toHaveBeenCalledWith({
        method   : 'POST',
        endpoint : '/integrations/ooyala/v2/players',
        payload  : 'random stuff'
      });
    });
  });
});
