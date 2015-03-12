'use strict';

describe('Kaltura Search', function() {
  var kalturaFilter, kalturaPager, kalturaSearch, kalturaClientWrapper,
      kalturaClientWrapperDeferred, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector, $q, $window, KalturaSearch){
      kalturaPager  = { pageIndex: null };
      kalturaFilter = {};

      $window.KalturaFilterPager     = sinon.stub().returns(kalturaPager);
      $window.KalturaBaseEntryFilter = sinon.stub().returns(kalturaFilter);

      kalturaClientWrapper = $injector.get('kalturaClientWrapper');
      $rootScope           = $injector.get('$rootScope');

      kalturaClientWrapperDeferred = $q.defer();
      spyOn(kalturaClientWrapper, 'list').and.returnValue(kalturaClientWrapperDeferred.promise);

      kalturaSearch = new KalturaSearch();
    });
  });

  describe('#limit', function() {
    beforeEach(function() { kalturaSearch.limit(111); });

    it('sets the page limit on the pager object', function() {
      expect(kalturaPager.pageSize).toEqual(111);
    });
  });

  describe('#isPaginable', function() {
    describe('before running the search', function () {
      it('returns false', function() {
        expect(kalturaSearch.isPaginable()).toBeFalsy();
      });
    });

    describe('when the current page index is lower than the max', function() {
      setPaginationValues(2, 1);

      it('returns true', function() {
        expect(kalturaSearch.isPaginable()).toBeTruthy();
      });
    });

    describe('when the current page index is equal to the max', function() {
      setPaginationValues(2, 2);

      it('returns false', function() {
        expect(kalturaSearch.isPaginable()).toBeFalsy();
      });
    });

    describe('when the current page index is greater to the max', function() {
      setPaginationValues(2, 3);

      it('returns false', function() {
        expect(kalturaSearch.isPaginable()).toBeFalsy();
      });
    });
  });

  describe('#nextPage', function() {
    beforeEach(function() {
      kalturaSearch.isPaginable = sinon.stub().returns(true);
      kalturaPager.pageIndex    = 1;
      kalturaSearch.nextPage();
    });

    it('increases the page index', function() {
      expect(kalturaPager.pageIndex).toBe(2);
    });
  });

  describe('#run', function() {
    var runPromise;

    beforeEach(function() {
      runPromise = kalturaSearch.run();
    });

    it('calls the #list method on the Kaltura Client Wrapper', function() {
      expect(kalturaClientWrapper.list).toHaveBeenCalledWith(kalturaFilter, kalturaPager);
    });

    describe('when the query succeeds', function() {
      var returnedValue;
      beforeEach(function() {
        runPromise.then(function(value){ returnedValue = value; });
        kalturaClientWrapperDeferred.resolve({totalCount: 10, objects: [1, 2]});
        $rootScope.$apply();
      });

      it('returns the objects property from the response', function() {
        expect(returnedValue).toEqual([1, 2]);
      });
    });
  });

  describe('#where', function() {
    beforeEach(function() {
      kalturaSearch.where('filter_name', 'filter_value');
    });

    it('adds a new property to the Kaltura Filter', function() {
      expect(kalturaFilter.filter_name).toEqual('filter_value');
    });
  });

  function setPaginationValues(numberOfPages, currentPage) {
    beforeEach(function() {
      kalturaSearch._numberOfPages = numberOfPages;
      kalturaPager.pageIndex       = currentPage;
    });
  }
});
