'use strict';

angular.module('contentful').factory('lookupLinksForEntityCache', ['$injector', function ($injector) {
  var logger = $injector.get('logger');

  return function lookupLinksForEntityCache(links, cache) {
    var ids = _.map(links, function (link) {
      if(!link || link && !link.sys){
        logger.logError('link object doesnt exist', {
          data: {
            links: links
          }
        });
        return null;
      }
      return link.sys.id;
    });
    return cache.getAll(ids);
  };
}]);
