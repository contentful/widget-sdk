'use strict';

angular.module('contentful').factory('KalturaSearch', ['require', function(require){
  var $window              = require('$window');
  var kalturaClientWrapper = require('kalturaClientWrapper');

  function KalturaSearch() {
    this.filter = new $window.KalturaBaseEntryFilter();
    this.pager  = new $window.KalturaFilterPager();

    this._numberOfMatchingEntries = 0;
    this._numberOfFetchedEntries  = 0;
    this._numberOfPages = 0;
  }

  KalturaSearch.prototype = {
    isPaginable: function() {
      return this.pager.pageIndex && this._numberOfPages && (this.pager.pageIndex < this._numberOfPages);
    },

    limit: function(value) {
      this.pager.pageSize = value;
      return this;
    },

    nextPage: function() {
      this.pager.pageIndex += 1;
      return this;
    },

    run: function() {
      return this._run();
    },

    where: function(name, value) {
      this.filter[name] = value;
      return this;
    },

    _run: function() {
      var promise = kalturaClientWrapper.list(this.filter, this.pager);

      /*
       * We use the numberOfPages as the flag to know if this search is still paginable
       * (see the #isPaginable method).
       *
       * Reseting it here prevents weird lookups before requests are finished.
       */
      this._numberOfPages = undefined;

      return promise.then(_.bind(this._processResponseFromKalturaAPI, this));
    },

    _processResponseFromKalturaAPI: function(response) {
      this._numberOfMatchingEntries = response.totalCount;
      this._numberOfFetchedEntries += response.objects.length;
      this._numberOfPages = Math.ceil(this._numberOfMatchingEntries / this.pager.pageSize);

      if (this._numberOfFetchedEntries < this._numberOfMatchingEntries)
        this.pager.pageIndex = Math.ceil(this._numberOfFetchedEntries / this.pager.pageSize);

      return response.objects;
    }
  };

  return KalturaSearch;
}]);
