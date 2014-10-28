'use strict';

describe('YoutubeGAPIAdapter', function() {
  var gapiStub, gapiDeferred, gapiLoadDeferred, youtubeGAPIAdapter, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      $provide.value('gapiLoader', {load: sinon.stub()});
    });

    inject(function($injector, $q){
      gapiDeferred       = $q.defer();
      gapiLoadDeferred   = $q.defer();

      gapiStub = {request: sinon.stub().returns(gapiDeferred.promise)};
      $injector.get('gapiLoader').load.returns(gapiLoadDeferred.promise);

      youtubeGAPIAdapter = $injector.get('youtubeGAPIAdapter');
      $rootScope         = $injector.get('$rootScope');
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('#videoInfo', function() {
    describe('on successful request', function() {
      beforeEach(function() {
        gapiLoadDeferred.resolve(gapiStub);
      });

      describe('when the response does not contain info about the requested video', function() {
        beforeEach(function() {
          gapiDeferred.resolve([]);
        });

        it('adapts the info to an expected structure', function() {
          var response;

          youtubeGAPIAdapter.videoInfo('random_id').then(function(_response_){ response = _response_; });
          $rootScope.$apply();

          expect(response.title).toBe(undefined);
        });
      });

      describe('when the response contains info about the requested video', function() {
        beforeEach(function() {
          gapiDeferred.resolve([{snippet: {title: 'title'}}]);
        });

        it('adapts the info to an expected structure', function() {
          var response;

          youtubeGAPIAdapter.videoInfo('random_id').then(function(_response_){ response = _response_; });
          $rootScope.$apply();

          expect(response.title).toBe('title');
        });
      });
    });
  });
});
