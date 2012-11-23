define([
  'angular',
  'templates/entry_list',

  'services/widgets'
], function(angular, entryListTemplate){
  'use strict';

  return {
    name: 'cfFieldEditor',
    factory: function(widgets, $compile) {
      return {
        restrict: 'E',
        scope: {
          value: '=',
          type: '='
        },
        link: function(scope, elm, attr) {
          var widget = widgets.editor(scope.type, attr.editor)
          elm.html(widget.template + '<span class="help-inline">'+widget.name+'</span>');
          $compile(elm.contents())(scope);
          if(typeof widget.link === 'function') {
            widget.link(scope, elm, attr);
          }
        }
      };
    }
  };

});
