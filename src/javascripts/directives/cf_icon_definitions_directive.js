'use strict';

/**
 * @ngdoc directive
 * @name cfIconDefinitions
 *
 * @description
 * This directive should be used only on a top level element on index.html
 *
 * At build time, the CF_SVG_ICONS_DEFINITION empty string will be replaced with
 * a string read from the contentful_icons.svg file which contains the definitions
 * for all the icons.
 *
 * When the directive runs it will inject the hidden SVG to be used later with the
 * use tag.
 *
 * See http://24ways.org/2014/an-overview-of-svg-sprite-creation-techniques/ for more information
 * on the technique used.
 *
 * This directive will also read metadata for each icon and load it into the iconMetadataStore
 * for later use by the cfIcon directive.
 *
 * This directive also exposes a keyboard shortcut (not available in production)
 * Cmd/Windows + i which shows a modal window with all the icons
 * for debugging purposes.
*/
angular.module('contentful').directive('cfIconDefinitions', ['$injector', function($injector){
  var environment       = $injector.get('environment');
  var modalDialog       = $injector.get('modalDialog');
  var $document         = $injector.get('$document');
  var $compile          = $injector.get('$compile');
  var keycodes          = $injector.get('keycodes');
  var iconMetadataStore = $injector.get('iconMetadataStore');

  // The following line will be replaced with the icons definitions at build time
  var CF_SVG_ICONS_DEFINITION = '';
  var CF_SVG_ICONS_METADATA = {};

  return {
    restrict: 'E',
    link: function (scope, el) {
      el.html(CF_SVG_ICONS_DEFINITION);

      var iconsMetadata = _.mapValues(CF_SVG_ICONS_METADATA, function (viewBox) {
        return {
          width: viewBox[2],
          height: viewBox[3]
        };
      });

      iconMetadataStore.set(iconsMetadata);

      // Show a modal with the icons for debugging purposes.
      // Press Meta(Cmd/Windows) + i to show it
      // Not active for production
      if(environment !== 'production') {
        $document.on('keydown', function (ev) {
          var iconList = _.map(CF_SVG_ICONS_METADATA, function (metadata, id) {
            id = id.replace('icon-', '');
            return '<div class="icon-metadata"><p>'+id+'</p><cf-icon name="'+id+'"></cf-icon></div>';
          });

          if(ev.keyCode === keycodes.I && ev.metaKey){
            modalDialog.open({
              title: 'Icons list',
              html: true,
              className: 'icons-metadata-dialog',
              message: $compile('<div><div class="icons-metadata">'+iconList.join('')+'</div></div>')(scope).html(),
              scope: scope
            });
          }
        });
      }
    }
  };
}]);

