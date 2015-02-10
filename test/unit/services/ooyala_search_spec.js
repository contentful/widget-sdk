'use strict';

describe('Ooyala Search', function() {
  var ooyalaClientSpy, ooyalaClientDeferred, ooyalaSearch, querySpy,
      $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      querySpy        = jasmine.createSpyObj('OoyalaQuerySpy', ['parameter', 'toQueryString']);
      ooyalaClientSpy = jasmine.createSpyObj('ooyalaClientSpy', ['assets']);
      $provide.value('OoyalaQuery', sinon.stub().returns(querySpy));
      $provide.value('ooyalaClient', ooyalaClientSpy);
    });
    inject(function($injector, $q, OoyalaSearch){
      $rootScope = $injector.get('$rootScope');

      ooyalaClientDeferred = $q.defer();

      ooyalaClientSpy.assets.and.returnValue(ooyalaClientDeferred.promise);
      ooyalaSearch = new OoyalaSearch();
    });
  });

  describe('#isPaginable', function() {
    describe('when the nextPageUrl property is defined', function() {
      beforeEach(function() {
        ooyalaSearch.nextPageUrl = 'value';
      });

      it('returns true', function() {
        expect(ooyalaSearch.isPaginable()).toBeTruthy();
      });
    });

    describe('when the nextPageUrl property is undefined', function() {
      beforeEach(function() {
        ooyalaSearch.nextPageUrl = undefined;
      });

      it('returns false', function() {
        expect(ooyalaSearch.isPaginable()).toBeFalsy();
      });
    });
  });

  describe('#limit', function() {
    var returnValue;
    beforeEach(function() {
      returnValue = ooyalaSearch.limit(10);
    });

    it('sets the limit parameter', function() {
      expect(querySpy.parameter).toHaveBeenCalledWith('limit', 10);
    });

    it('returns the Ooyala Search instance', function() {
      expect(returnValue).toEqual(ooyalaSearch);
    });
  });

  describe('#where', function() {
    var returnValue;
    beforeEach(function() {
      returnValue = ooyalaSearch.where('name', 'mp4');
    });
    it('sets the given filter parameter', function() {
      expect(querySpy.parameter).toHaveBeenCalledWith('name', 'mp4');
    });

    it('returns the Ooyala Search instance', function() {
      expect(returnValue).toEqual(ooyalaSearch);
    });
  });

  describe('#nextPage', function() {
    var returnValue;
    beforeEach(function() {
      ooyalaSearch.nextPageUrl = 'value=1&page_token=1234&value=2';
      returnValue              = ooyalaSearch.nextPage();
    });

    it('sets the page_token parameter to the page token value in the nextPageUrl property', function() {
      expect(querySpy.parameter).toHaveBeenCalledWith('page_token', '1234');
    });

    it('returns the Ooyala Search instance', function() {
      expect(returnValue).toEqual(ooyalaSearch);
    });
  });

  describe('#run', function() {
    var ooyalaSearchPromise;
    beforeEach(function() {
      querySpy.toQueryString.and.returnValue('query-string');
      ooyalaSearchPromise = ooyalaSearch.run();
    });

    it('executes the #assets method of the ooyalaClient', function() {
      expect(ooyalaClientSpy.assets).toHaveBeenCalledWith('query-string');
    });

    it('resets the nextPageUrl property', function() {
      expect(ooyalaSearch.nextPageUrl).toBeUndefined();
    });

    describe('if the request succeeds', function() {
      var items;
      beforeEach(function() {
        ooyalaClientDeferred.resolve({next_page: 'page', items: 'items'});
        ooyalaSearchPromise.then(function(_items_){ items = _items_; });
        $rootScope.$apply();
      });

      it('sets the nextPageUrl property to the next_page value in the response', function() {
        expect(ooyalaSearch.nextPageUrl).toEqual('page');
      });

      it('returns the items in the response', function() {
        expect(items).toEqual('items');
      });
    });
  });
});
