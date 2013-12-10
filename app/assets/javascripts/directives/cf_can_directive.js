angular.module('contentful').directive('cfCan', [
  'enforcements', 'authorization', 'reasonsDenied',
  function (enforcements, authorization, reasonsDenied) {
  'use strict';

  var canGroupsRe = /\[\s*(\w*)\s*,\s*(\w*)\s*\]/g;

  function parseMultiCanExpression(expression) {
    var groupedParams;
    var results = [];
    while(groupedParams = canGroupsRe.exec(expression)){
      results.push([
        groupedParams[1],
        groupedParams[2]
      ]);
    }
    return results.length > 0 ? results : undefined;
  }

  function parseSingleCanExpression(expression) {
    var results = _.map(expression.split(','), function (param) {
      return param.trim();
    });
    return results.length > 1 ? results : undefined;
  }

  function parseCanExpression(canExpression) {
    var canParams = parseMultiCanExpression(canExpression);
    if(canParams) return canParams;
    if(!canParams) {
      canParams = parseSingleCanExpression(canExpression);
      if(canParams) return [canParams];
    }
    throw new Error('Invalid can expression');
  }

  function evalExpressions(canParams, can) {
    var results = [], params;
    while(canParams.length > 0){
      params = canParams.shift();
      results.push({
        can: can.apply(can, params),
        reasons: reasonsDenied.apply(reasonsDenied, params)
      });
    }
    return results;
  }

  function makePropGetter(elem){
    return function getCssProperty(name) {
      return parseInt(elem.css(name), 10);
    };
  }

  /**
   * Attributes:
   * cf-can="action, Entity" or cf-can="[action1, Entity1], [action2, Entity2]"
   * Hides or disables the element if expression is false. Element is disabled if reasons exist.
   * cf-can-no-disable - makes sure this element can't ever be disabled
   * cf-can-no-hide - makes sure this element can't ever be hidden
   */
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      var deactivateWatcher = scope.$watch(function () {
        return authorization.spaceContext;
      }, function (space) {
        if(!space) return;
        deactivateWatcher();
        scope.cfCanDisabled = false;
        if(elem.hasClass('ng-hide')) elem.removeClass('ng-hide');
        if(elem.attr('disabled')) elem.attr('disabled', false);
        if(elem.attr('disable-layer')) $('#'+elem.attr('disable-layer')).remove();

        var canParams = parseCanExpression(attrs.cfCan);
        var canResults = evalExpressions(_.clone(canParams), scope.can);
        var paramIndex = _.findIndex(canResults, function (val) {
          return !val.can;
        });
        if(paramIndex < 0) return;

        var reasons = enforcements.determineEnforcement(canResults[paramIndex].reasons, canParams[paramIndex][1]);

        var disableButton = !('cfCanNoDisable' in attrs);
        var hideButton = !('cfCanNoHide' in attrs);
        if(reasons){
          if(disableButton){
            elem.attr('disabled', true);
            scope.cfCanDisabled = true;
            var id = 'transparent-button-layer-'+Math.ceil(Math.random()*100000);
            elem.attr('disable-layer', id);
            var layer = $('<div id="'+id+'" class="transparent-button-layer"></div>');
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
              title: reasons.tooltip,
              trigger: 'hover'
            });
          }
        } else if(hideButton){
          elem.addClass('ng-hide');
        }
      });
    }
  };
}]);
