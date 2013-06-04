'use strict';

angular.module('contentful').provider('routing', function ($routeProvider) {
  $routeProvider.when('/spaces/:spaceId', {viewType: null, noNavigate: true});
  $routeProvider.when('/spaces/:spaceId/entries', {viewType: 'entry-list'});
  $routeProvider.when('/spaces/:spaceId/entries/:entryId', {viewType: 'entry-editor'});
  $routeProvider.when('/spaces/:spaceId/entry_types', {viewType: 'entry-type-list'});
  $routeProvider.when('/spaces/:spaceId/entry_types/:entryTypeId', {viewType: 'entry-type-editor'});
  $routeProvider.when('/spaces/:spaceId/api_keys', {viewType: 'content-delivery'});
  $routeProvider.when('/spaces/:spaceId/api_keys/:apiKeyId', {viewType: 'api-key-editor'});
  $routeProvider.otherwise({noSpace: true});

  this.$get = function ($rootScope, $route, $location) {
    function Routing(){}

    Routing.prototype = {
      getRoute: function(){
        if(!$route.current) $route.reload();
        return $route.current;
      },

      getSpaceId: function () {
        if (this.getRoute().noSpace) {
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
        } else if (tab.viewType == 'entry-type-editor') {
          path = path + '/entry_types/' + tab.params.entryType.getId();
        } else if (tab.viewType == 'entry-type-list') {
          path = path + '/entry_types';
        } else if (tab.viewType == 'content-delivery') {
          path = path + '/api_keys';
        } else if (tab.viewType == 'api-key-editor') {
          var apiKeyId = tab.params.apiKey.getId();
          if (apiKeyId) {
            path = path + '/api_keys/' + apiKeyId;
          } else {
            path = path + '/api_keys';
          }
        }
        $location.path(path);
      }
    };

    return new Routing();
  };
});
