'use strict';

angular.module('contentful').factory('gettyImagesFactory', ['requre', function gettyImagesFactory(require) {
  var $http  = require('$http');
  var $q     = require('$q');
  var client = require('client');
  var logger = require('logger');

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
        // remove Request form the end because of CreateDownloadRequest
        data[operation.replace(/Request$/g, '') + 'RequestBody'] = bodyParams;

        return $http({
          method: 'POST',
          url: operationURI,
          data: data,
          headers: {
            'Content-Type': 'application/json'
          },
          transformRequest: transformRequest,
          transformResponse: transformResponse(operation),
        }).then(parseGettyHeaders);
      });
    };
  });

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
        data = JSON.parse(data);
        return {
          result: data[operation + 'Result'],
          headers: data.ResponseHeader
        };
      } else {
        return data;
      }
    };
  }

  function parseGettyHeaders(response) {
    var deferred = $q.defer();
    try {
      var status = response.data.headers.Status.toLowerCase();
      if(status == 'success' || status == 'warning')
        deferred.resolve(response);
      else
        deferred.reject(response.data.headers);
    } catch(e){
      deferred.reject(e);
    }
    return deferred.promise;
  }

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

  function getNewToken (spaceId, result) {
    var path;
    try {
      path = 'getty_images/' + space.getOrganizationId();
    } catch(exp){
      logger.logError('Getty Images space organizations exception', {
        data: {
          space: space,
          exp: exp
        }
      });
    }

    client.getIntegrationToken(path)
    .then(function(data){
      result.resolve(data.access_token);
      var expiresIn = parseInt(data.expires_in, 10);
      if (isNaN(expiresIn)) {
        expiresIn = 1800;
      }
      accessTokens[spaceId] = data.access_token;
      setTimeout(function () { delete accessTokens[spaceId]; }, 1000 * expiresIn);
    })
    .catch(function(err){
      result.reject(err);
    });
  }

  service.getImageDownload = function (imageId, sizeKey) {
    var params = {
      ImageSizes: [{
        ImageId: imageId,
        SizeKey: sizeKey
      }]
    };
    return service.getImageDownloadAuthorizations(params).then(function (res) {
      var image = _.find(res.data.result.Images, function (image) {
        return image.ImageId === imageId && image.SizeKey === sizeKey;
      });
      var downloadToken = image.Authorizations[0].DownloadToken;
      var requestHeader = {
        CoordinationId: res.data.headers.CoordinationId
      };
      var requestBody = {
        DownloadItems: [
          {DownloadToken: downloadToken}
        ]
      };
      return service.createDownloadRequest(requestHeader, requestBody);
    });
  };

  return function (currentSpace) {
    space = currentSpace;
    return service;
  };

}]);
