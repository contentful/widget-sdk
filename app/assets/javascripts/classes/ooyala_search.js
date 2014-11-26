'use strict';

angular.module('contentful').factory('OoyalaSearch', ['$injector', function($injector){
  var ooyalaClient        = $injector.get('ooyalaClient');
  var OoyalaQuery         = $injector.get('OoyalaQuery');

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
      if (!this.nextPageUrl) return;

      return this._query('raw', this.nextPageUrl);
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
