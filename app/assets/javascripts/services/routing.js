'use strict';

angular.module('contentful').provider('routing', function ($routeProvider) {
  $routeProvider.when('/spaces/:spaceId', {viewType: null});
  $routeProvider.when('/spaces/:spaceId/entries', {viewType: 'entry-list'});
  $routeProvider.when('/spaces/:spaceId/entries/:entryId', {viewType: 'entry-editor'});
  $routeProvider.when('/spaces/:spaceId/assets', {viewType: 'asset-list'});
  $routeProvider.when('/spaces/:spaceId/assets/:assetId', {viewType: 'asset-editor'});
  $routeProvider.when('/spaces/:spaceId/content_types', {viewType: 'content-type-list'});
  $routeProvider.when('/spaces/:spaceId/content_types/:contentTypeId', {viewType: 'content-type-editor'});
  $routeProvider.when('/spaces/:spaceId/api_keys', {viewType: 'api-key-list'});
  $routeProvider.when('/spaces/:spaceId/api_keys/:apiKeyId', {viewType: 'api-key-editor'});
  $routeProvider.when('/spaces/:spaceId/settings/:pathSuffix*', {viewType: 'space-settings'});
  $routeProvider.when('/spaces/:spaceId/settings', {viewType: 'space-settings'});
  $routeProvider.when('/account/:pathSuffix*', {viewType: 'account'});
  $routeProvider.when('/account', {viewType: 'account'});
  $routeProvider.otherwise({root: true});

  this.$get = function ($rootScope, $route, $location) {
    function Routing(){}

    Routing.prototype = {
      getRoute: function(){
        return $route.current;
      },

      getPath: function () {
        return $location.path();
      },

      getSpaceId: function () {
        if (!this.getRoute() || this.getRoute().noSpace) {
          return null;
        } else {
          return this.getRoute().params.spaceId;
        }
      },

      goToSpace: function (space) {
        if (space) $location.path('/spaces/'+space.getId());
      },

      goToTab : function (tab, space) {
        $location.path(this.makeLocation(tab, space));
      },

      makeLocation: function (tab, space) {
        var spaceId = space ? space.getId() : this.getSpaceId();
        var path = '/spaces/'+spaceId;
        if (tab.viewType == 'entry-editor') {
          path = path + '/entries/' + tab.params.entry.getId();
        } else if (tab.viewType == 'entry-list') {
          path = path + '/entries';
        } else if (tab.viewType == 'asset-editor') {
          path = path + '/assets/' + tab.params.asset.getId();
        } else if (tab.viewType == 'asset-list') {
          path = path + '/assets';
        } else if (tab.viewType == 'content-type-editor') {
          path = path + '/content_types/' + tab.params.contentType.getId();
        } else if (tab.viewType == 'content-type-list') {
          path = path + '/content_types';
        } else if (tab.viewType == 'api-key-list') {
          path = path + '/api_keys';
        } else if (tab.viewType == 'api-key-editor') {
          var apiKeyId = tab.params.apiKey.getId();
          if (apiKeyId) {
            path = path + '/api_keys/' + apiKeyId;
          } else {
            path = path + '/api_keys/new';
          }
        } else if (tab.viewType == 'space-settings') {
          path = path + '/settings';
          if (tab.params.pathSuffix) path = path + '/' + tab.params.pathSuffix;
        }
        return path;
      }
    };

    return new Routing();
  };
});
