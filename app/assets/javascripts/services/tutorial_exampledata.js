'use strict';

angular.module('contentful').factory('tutorialExampledata', function ($q, $http, environment) {
  var promise;
  return {
    load: function () {
      if (!promise) promise = $q.all([
        $http.get('//'+environment.settings.app_host + '/app/sample_data/content_types.json'),
        $http.get('//'+environment.settings.app_host + '/app/sample_data/entries.json')]).
      then(function (response) {
        return {
          contentTypes: response[0].data.items,
          entries: _.map(response[1].data.items, function (entry) {
            _.each(entry.fields, function (data, name) {
              entry.fields[name] = {'en-US': data};
            });
            return entry;
          })
        };
      });
      return promise;
    }
  };
});

