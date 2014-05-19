'use strict';

angular.module('contentful').factory('gettyImagesFactory', function gettyImagesFactory($http, $q, client) {
  var accessTokens = {};
  var service = {};
  var space;

  var operations = {
    SearchForImages: 'https://connect.gettyimages.com/v2/search/SearchForImages',
    GetImageDetails: 'https://connect.gettyimages.com/v1/search/GetImageDetails',
    GetImageDownloadAuthorizations: 'https://connect.gettyimages.com/v1/download/GetImageDownloadAuthorizations',
    CreateDownloadRequest: 'https://connect.gettyimages.com/v1/download/CreateDownloadRequest',
  };

  Object.keys(operations).forEach(function (operation) {
    var operationURI = operations[operation];
    var methodName = operation.charAt(0).toLowerCase() + operation.substr(1);

    service[methodName] = function (headerParams, bodyParams) {
      if(arguments.length === 1) {
        bodyParams = headerParams;
        headerParams = {};
      }
      return service.getIntegrationToken().then(function (token) {
        var data = { RequestHeader: _.assign({ Token: token}, headerParams)};
        data[operation + 'RequestBody'] = bodyParams;

        return $http({
          method: 'POST',
<<<<<<< HEAD
          uri: operationURI,
=======
          url: operationURI,
>>>>>>> restructure the service
          data: data,
          headers: {
            'Content-Type': 'application/json'
          },
          transformRequest: transformRequest,
          transformResponse: transformResponse(operation),
        });
      });
    };
  });

  service.getIntegrationToken = function () {
    var spaceId = space.getId();
    var result = $q.defer();
    if (spaceId in accessTokens) {
      result.resolve(accessTokens[spaceId]);
    } else {
      getNewToken(spaceId, result);
    }

    return result.promise;
  };

  service.getImageDownload = function (size, params) {
    service.getImageDownloadAuthorizations(params).then(function (res) {
      var requestHeader = {
        CoordinationId: res.ResponseHeader.CoordinationId
      };
      var requestBody = {
      };
      service.createDownloadRequest(requestHeader, requestBody).then(function () {
        
      });
    });
  };

  function getNewToken (spaceId, result) {
    var path = 'getty_images/' + space.getOrganizationId();
    client.getIntegrationToken(path, function (err, data) {
      if (err) return result.reject(err);
      result.resolve(data.access_token);
      var expiresIn = parseInt(data.expires_in, 10);
      if (isNaN(expiresIn)) {
        expiresIn = 1800;
      }
      accessTokens[spaceId] = data.access_token;
      setTimeout(function () { delete accessTokens[spaceId]; }, 1000 * expiresIn);
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
      var typeHeader = header('Content-Type');
      if (typeHeader && typeHeader.indexOf('application/json') >= 0) {
        return JSON.parse(data)[operation + 'Result'];
      } else {
        return data;
      }
    };
  }

  return function (currentSpace) {
    space = currentSpace;
    return service;
  };

});
