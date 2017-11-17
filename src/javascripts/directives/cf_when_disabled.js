'use strict';

angular.module('contentful').directive('cfWhenDisabled', ['require', function (require) {

  var accessChecker = require('accessChecker');

  function makePropGetter(elem){
    return function getCssProperty(name) {
      return parseInt(elem.css(name), 10);
    };
  }

  // A layer over the button is necessary because disabled buttons don't react to hover events
  function makeLayer(id, elem) {
    var position = elem.position();
    var prop = makePropGetter(elem);
    var layer = $('<div id="'+id+'" class="transparent-button-layer"></div>');
    layer.css({
      top: position.top + prop('marginTop'),
      left: position.left + prop('marginLeft'),
      width: elem.width() +
             prop('paddingLeft')+
             prop('paddingRight')+
             prop('borderLeft')+
             prop('borderRight'),
      height: elem.height()+
              prop('paddingTop')+
              prop('paddingBottom')+
              prop('borderTop')+
              prop('borderBottom'),
    });
    return layer;
  }

  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      scope.$watch(function () {
        return accessChecker.getResponseByActionName(attrs.cfWhenDisabled);
      }, addTooltip, true);

      function addTooltip(response) {
        if (response && response.shouldDisable && response.enforcement) {
          var layerId = 'transparent-button-layer-'+Math.ceil(Math.random()*100000);
          elem.attr('disable-layer', layerId);

          setTimeout(function () {
            var layer = makeLayer(layerId, elem);
            layer.prependTo(elem.parent());
            layer.tooltip({
              title: response.enforcement.tooltip,
              trigger: 'hover'
            });
          }, 1000);
        }
      }
    }
  };
}]);
