'use strict';

angular.module('contentful').provider('routing', function ($routeProvider) {
  $routeProvider.when('/spaces/:spaceId', {viewType: null, noNavigate: true});
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
  $routeProvider.otherwise({noSpace: true});

  this.$get = function ($rootScope, $route, $location) {
    function Routing(){}

    Routing.prototype = {
      getRoute: function(){
        if(!$route.current) $route.reload();
        return $route.current;
      },

      getSpaceId: function () {
        if (!this.getRoute() || this.getRoute().noSpace) {
          return null;
        } else {
          return this.getRoute().params.spaceId;
        }
      },

      setSpace: function (space) {
        $location.path('/spaces/'+space.getId());
      },

      setTab: function (tab, space) {
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
            path = path + '/api_keys';
          }
        } else if (tab.viewType == 'iframe') {
          if (tab.params.mode === 'spaceSettings') {
            path = path + '/settings';
            if (tab.params.pathSuffix) path = path + '/' + tab.params.pathSuffix;
          }
        }
        $location.path(path);
      }
    };

    return new Routing();
  };
});
