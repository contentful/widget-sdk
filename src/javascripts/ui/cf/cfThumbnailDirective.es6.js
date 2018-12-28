import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import $ from 'jquery';
import mimetype from '@contentful/mimetype';
import { h } from 'utils/legacy-html-hyperscript';

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

registerDirective('cfThumbnail', [
  'ui/cf/thumbnailHelpers.es6',
  ({ isValidImage, getExternalImageUrl }) => {
    const groupToIconMap = {
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

    const template = [
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
      link: function(scope, _el, attrs) {
        const options = {
          fit: attrs.fit,
          focus: attrs.focus
        };

        const size = parseInt(attrs.size, 10);
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

        scope.$watchCollection('file', file => {
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
    function getThumbnailUrl(file, options) {
      const imageUrl = getImageUrl(file);
      if (!imageUrl) {
        return imageUrl;
      }

      const params = _.pickBy(
        {
          w: options.width,
          h: options.height !== undefined ? options.height : options.width,
          f: options.focus,
          fit: options.fit
        },
        value => !!value
      );

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
    function getImageUrl(file) {
      if (!file) {
        return null;
      }

      if (isValidImage(file.contentType)) {
        return getExternalImageUrl(file.url);
      } else {
        return null;
      }
    }

    function getIconName(file) {
      if (!file) {
        return '';
      }

      const groupName = mimetype.getGroupLabel({
        type: file.contentType,
        fallbackFileName: file.fileName
      });

      if (groupName in groupToIconMap) {
        return 'fa fa-file-' + groupToIconMap[groupName] + '-o';
      } else {
        return 'fa fa-paperclip';
      }
    }
  }
]);
