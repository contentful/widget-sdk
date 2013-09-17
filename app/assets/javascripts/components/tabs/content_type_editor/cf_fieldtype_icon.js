'use strict';

angular.module('contentful').directive('cfFieldtypeIcon', function(getFieldTypeName){
  var nameTemplates = {
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
  };

  return {
    restrict: 'C',
    template: '',
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
        elem.html(nameTemplates[fieldTypeName] || '<i class="ss-help"></i>');
        title = nameTemplates[fieldTypeName] ? fieldTypeName : 'Unknown Type';
      });

      scope.$on('$destroy', function () {
        unwatch();
        unwatch = null;
        elem.tooltip('destroy');
      });
    }
  };
});
