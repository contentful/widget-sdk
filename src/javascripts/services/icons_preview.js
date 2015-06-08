'use strict';

/**
 * @ngdoc service
 * @name iconsPreview
 *
 * @description
 * This directive exposes a keyboard shortcut (not available in production)
 * Cmd/Windows + \ which shows a modal window with all the icons
 * for debugging purposes.
*/
angular.module('contentful').service('iconsPreview', ['$injector', function($injector){
  var environment       = $injector.get('environment');
  var modalDialog       = $injector.get('modalDialog');
  var $rootScope        = $injector.get('$rootScope');
  var $document         = $injector.get('$document');
  var keycodes          = $injector.get('keycodes');
  var icons             = $injector.get('icons');

  return function start() {
    if(environment !== 'production') {
      $document.on('keydown', function (ev) {
        var iconList = _.map(icons, function (str, id) {
          return '<div class="icon-metadata"><p>'+id+'</p><div>'+str+'</div></div>';
        });

        if(ev.keyCode === keycodes.BACKSLASH && ev.metaKey){
          var scope = $rootScope.$new();
          modalDialog.open({
            title: 'Icons list',
            html: true,
            className: 'icons-metadata-dialog',
            message: '<div class="icons-metadata">'+iconList.join('')+'</div>',
            scope: scope
          });
        }
      });
    }
  };
}]);

