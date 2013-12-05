angular.module('contentful').directive('cfCan', ['determineEnforcement', 'authorization', function (determineEnforcement, authorization) {
  'use strict';

  function makePropGetter(elem){
    return function getCssProperty(name) {
      return parseInt(elem.css(name), 10);
    };
  }

  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      var setupWatcher = scope.$watch(function () {
        return authorization.spaceContext;
      }, function (space) {
        if(!space) return;
        setupWatcher();
        scope.$watch(attrs.cfCan, function (can) {
          if(can) return;
          var reasons = attrs.cfCanEntity ? determineEnforcement.computeUsage(attrs.cfCanEntity) : undefined;

          var disableButton = !('cfCanNoDisable' in attrs);
          var hideButton = !('cfCanNoHide' in attrs);
          if(reasons){
            if(disableButton){
              elem.attr('disabled', true);
              var layer = $('<div class="transparent-button-layer"></div>');
              var position = elem.position();
              var prop = makePropGetter(elem);
              layer.css({
                top: position.top + prop('marginTop'),
                left: position.left + prop('marginLeft'),
                width: elem.width() + prop('paddingLeft')+
                                      prop('paddingRight')+
                                      prop('borderLeft')+
                                      prop('borderRight'),
                height: elem.height() + prop('paddingTop')+
                                      prop('paddingBottom')+
                                      prop('borderTop')+
                                      prop('borderBottom'),
              });
              layer.prependTo(elem.parent());
              layer.tooltip({
                title: reasons,
                trigger: 'hover'
              });
            }
          } else if(hideButton){
            elem.addClass('ng-hide');
          }
        });
      });
    }
  };
}]);
