'use strict';

angular.module('contentful').factory('OoyalaSearch', ['$injector', function($injector){
  var ooyalaClient        = $injector.get('ooyalaClient');
  var OoyalaQuery         = $injector.get('OoyalaQuery');

  var PAGE_TOKEN_REGEXP = /page_token=([^?]+)&?.*$/;

  function OoyalaSearch(options) {
    ooyalaClient.setOrganizationId(options.organizationId);
    this.query       = new OoyalaQuery();
    this.nextPageUrl = undefined;
  }

  OoyalaSearch.prototype = {
    isPaginable: function() {
      return !!this.nextPageUrl;
    },

    limit: function(value) {
      this.query.parameter('limit', value);
      return this;
    },

    where: function(name, value) {
      this.query.parameter(name, value);
      return this;
    },

    nextPage: function() {
      var pageTokenMatch = this.nextPageUrl.match(PAGE_TOKEN_REGEXP);
      this.query.parameter('page_token', pageTokenMatch[1]);

      return this;
    },

    run: function() {
      return this._query('assets', this.query.toQueryString());
    },

    _query: function(method, path) {
      var self = this;

      this.nextPageUrl = undefined;

      return ooyalaClient[method](path)
        .then(function(response){
          self.nextPageUrl = response.next_page;
          return response.items;
        });
    }
  };

  return OoyalaSearch;
}]);
