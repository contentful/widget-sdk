'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc directive
   * @name cfImgLoadEvent
   * @description
   * Attribute directive that emits loading state events for `<img>`
   * tags.
   *
   * When this directive is applied to an image element it will emit the
   * 'imageLoadState' event on the scope when the load state changes. The
   * event parameter is either 'loading' or 'loaded'.
   */
  .directive('cfImgLoadEvent', [
    () => ({
      link: function(scope, elem, attrs) {
        let previousSrc;

        scope.$watch(
          () => attrs.src,
          src => {
            if (src !== previousSrc) {
              if (src) {
                scope.$emit('imageLoadState', 'loading');
              } else {
                scope.$emit('imageLoadState', 'loaded');
              }
              previousSrc = src;
            }
          }
        );

        elem.on('load', () => {
          scope.$apply(() => {
            scope.$emit('imageLoadState', 'loaded');
          });
        });
      }
    })
  ]);
