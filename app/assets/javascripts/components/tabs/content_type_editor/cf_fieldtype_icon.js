'use strict';

angular.module('contentful').directive('cfFieldtypeIcon', function(getFieldTypeName){
  var nameTemplates = _.each({
    'Text'           :'<strong>ABC</strong>',
    'Symbol'         :'<strong>USD</strong>',
    'Number'         :'<strong>12</strong>',
    'Decimal Number' :'<strong>1,45</strong>',
    'Yes/No'         :'<strong>Y/N</strong>',
    'Date/Time'      :'<i class="ss-calendar"></i>',
    'Object'         :'<strong>{}</strong>',
    'Link to Entry'  :'<i class="ss-file"></i>',
    'Link to Asset'  :'<i class="ss-attach"></i>',
    'List of Entries':'<i class="ss-file"></i><strong>+</strong>',
    'List of Assets' :'<i class="ss-attach"></i><strong>+</strong>',
    'List of Symbols':'<strong>USD+</strong>',
    'Location'       :'<i class="ss-location"></i>'
  }, function (html, title, templates) {
    templates[title] = $(html);
  });

  var fallback = $('<i class="ss-help"></i>');

  return {
    restrict: 'C',
    link: function (scope, elem, attr) {
      var title;
      if (angular.isDefined(attr.showTooltip)) elem.tooltip({
        delay: {show: 100, hide: 100},
        title: function () {
          return title;
        }
      });
      var unwatch = scope.$watch(function () {
        var field = scope.$eval(attr.field);
        return getFieldTypeName(field);
      }, function (fieldTypeName) {
        elem.empty().append(nameTemplates[fieldTypeName].clone() || fallback);
        title = nameTemplates[fieldTypeName] ? 'Field Type: ' + fieldTypeName : 'Unknown Type';
      });

      scope.$on('$destroy', function () {
        unwatch();
        unwatch = null;
        elem.tooltip('destroy');
      });
    }
  };
});
