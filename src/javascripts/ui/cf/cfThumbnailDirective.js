'use strict';

/**
 * @ngdoc directive
 * @name cfThumbnail
 * @description
 * Create a thumbnail for an asset file object.
 *
 * The thumbnail either shows a thumbnailed image or an icon for the
 * file MIME type.
 *
 * @usage[js]
 * h('cf-thumbnail', {
 *   file: 'fileObject'
 *   size: 'pixels' // if size is used, width and height are ignored
 *   width: 'pixels' // can be used with height or by itself
 *   height: 'pixels' // can be used with width or by itself
 *   fit: 'scale|crop|pad|thumb'
 *   focus: 'bottom|right|bottom_right|face|faces|...'
 * })
 *
 */

angular.module('contentful')
.directive('cfThumbnail', ['require', function (require) {
  var mimetype = require('mimetype');
  var h = require('utils/hyperscript').h;
  var TokenStore = require('services/TokenStore');
  var HostnameTransformer = require('hostnameTransformer');

  var groupToIconMap = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    richtext: 'word',
    presentation: 'powerpoint',
    spreadsheet: 'excel',
    pdfdocument: 'pdf',
    archive: 'zip',
    plaintext: 'text',
    code: 'code',
    markup: 'code'
  };

  /**
   * List of asset MIME types we want to show an image preview for.
   */
  var imageMimeTypes = [
    'image/bmp',
    'image/x-windows-bmp',
    'image/gif',
    // This is not a valid MIME type but we supported it in the past.
    'image/jpg',
    'image/jpeg',
    'image/pjpeg',
    'image/x-jps',
    'image/png',
    'image/tiff',
    'image/x-tiff',
    'image/svg+xml'
  ];

  var template = [
    h('img.thumbnail', {
      ngIf: 'thumbnailUrl',
      ngSrc: '{{thumbnailUrl}}',
      ngStyle: '{{imageStyle}}',
      cfImgLoadEvent: true
    }),
    h('i.icon', {
      ngIf: '!thumbnailUrl',
      ngClass: 'iconName'
    })
  ].join('');


  return {
    restrict: 'E',
    template: template,
    scope: {
      file: '='
    },
    link: function (scope, _el, attrs) {
      var options = {
        fit: attrs.fit,
        focus: attrs.focus
      };

      var size = parseInt(attrs.size, 10);
      if (size > 0) {
        options.width = options.height = size;
      } else {
        options.width = attrs.width || undefined;
        options.height = attrs.height || undefined;
      }

      scope.imageStyle = {
        width: options.width ? options.width + 'px' : '',
        height: options.height ? options.height + 'px' : ''
      };

      scope.$watchCollection('file', function (file) {
        scope.thumbnailUrl = getThumbnailUrl(file, options);
        scope.iconName = getIconName(file);
      });
    }
  };

  /**
   * Given a file object from an asset and a list of options this
   * function produces the URL for a thumbnail from the original image
   * URL.
   *
   * It might return `null` if the file does not have a URL or if the
   * URL is not hosted on the 'images' subdomain.
   *
   * @param {API.File}
   * @param {object} options
   * @returns {string?}
   */
  function getThumbnailUrl (file, options) {
    var imageUrl = getImageUrl(file);
    if (!imageUrl) {
      return imageUrl;
    }

    var params = _.pickBy({
      w: options.width,
      h: options.width,
      f: options.focus,
      fit: options.fit
    }, function (value) {
      return !!value;
    });

    if (_.isEmpty(params)) {
      return imageUrl;
    } else {
      // TODO use qs library
      return imageUrl + '?' + $.param(params);
    }
  }

  /**
   * Get the external image URL if the file has an image MIME type and
   * is served from the contentful image proxy service.
   *
   * Otherwise return `null`.
   */
  function getImageUrl (file) {
    if (!file) {
      return null;
    }

    var isImage = imageMimeTypes.indexOf(file.contentType) > -1;

    if (isImage) {
      return externalImageUrl(file.url);
    } else {
      return null;
    }
  }

  /**
   * Given a URL on the 'assets.contentful.com' or
   * 'images.contentful.com' domain we replace the host with the images
   * host configured for the organization.
   */
  function externalImageUrl (url) {
    var domains = TokenStore.getDomains();
    var internalUrl = HostnameTransformer.toInternal(url, domains);
    domains.assets = domains.images;
    return HostnameTransformer.toExternal(internalUrl, domains);
  }

  function getIconName (file) {
    if (!file) {
      return '';
    }

    var groupName = mimetype.getGroupLabel({
      type: file.contentType,
      fallbackFileName: file.fileName
    });

    if (groupName in groupToIconMap) {
      return 'fa fa-file-' + groupToIconMap[groupName] + '-o';
    } else {
      return 'fa fa-paperclip';
    }
  }
}]);
