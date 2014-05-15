'use strict';

angular.module('contentful').factory('gettyImages', function ($http, $q, client, routing) {
  var accessTokens = {};
  var service = {};

  var operations = {
    SearchForImages: 'http://connect.gettyimages.com/v2/search/SearchForImages',
    GetImageDetails: 'http://connect.gettyimages.com/v1/search/GetImageDetails',
    GetImageDownloadAuthorizations: 'https://connect.gettyimages.com/v1/download/GetImageDownloadAuthorizations',
    CreateDownloadRequest: 'https://connect.gettyimages.com/v1/download/CreateDownloadRequest',
  };

  Object.keys(operations).forEach(function (operation) {
    var operationURI = operations[operation];
    var methodName = operation.charAt(0).toLowerCase() + operation.substr(1);

    service[methodName] = function (params) {
      return service.getIntegrationToken().then(function (token) {
        var data = { RequestHeader: { Token: token } };
        data[operation + 'Body'] = params;

        return $http({
          method: 'POST',
          uri: operationURI, 
          data: data,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
          },
          transformRequest: transformRequest,
          transformResponse: transformResponse(operation),
        });
      });
    }
  });

  service.getIntegrationToken = function () {
    var spaceId = routing.getSpaceId();
    var result = $q.defer();
    if (spaceId in accessTokens) {
      result.resolve(accessTokens[spaceId]);
    } else {
      getNewToken(spaceId, result);
    }

    return result.promise;
  };

  return service;

  function getNewToken (spaceId, result) {
    client.getSpace(spaceId, function (err, space) {
      if (err) return result.resolve(err);

      var path = 'getty_images/' + space.getOrganizationId();
      client.getIntegrationToken(path, function (err, data) {
        if (err) return result.reject(err);
        result.resolve(data);
        var expiresIn = parseInt(data.expires_in, 10);
        if (isNaN(expiresIn)) {
          expiresIn = 1800;
        }
        accessTokens[spaceId] = data.access_token;
        setTimeout(function () { delete accessTokens[spaceId]; }, 1000 * expiresIn)
      });
    });
  }

  function transformRequest (data, header) {
    header('Content-Type', 'application/json');
    var body = JSON.stringify(data);
    header('Content-Length', body.length);
    return body;
  }

  function transformResponse (operation) {
    return function (data, header) {
      if (header('Contenty-Type') === 'application/json') {
        return JSON.parse(data)[operation + 'Result'];
      } else {
        return data;
      }
    }
  }
});
