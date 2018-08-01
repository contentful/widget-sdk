'use strict';

angular.module('contentful').directive('cfWhenDisabled', ['require', require => {

  const accessChecker = require('access_control/AccessChecker');

  function makePropGetter(elem){
    return function getCssProperty(name) {
      return parseInt(elem.css(name), 10);
    };
  }

  // A layer over the button is necessary because disabled buttons don't react to hover events
  function makeLayer(id, elem) {
    const position = elem.position();
    const prop = makePropGetter(elem);
    const layer = $('<div id="'+id+'" class="transparent-button-layer"></div>');
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
      scope.$watch(() => accessChecker.getResponseByActionName(attrs.cfWhenDisabled), addTooltip, true);

      function addTooltip(response) {
        if (response && response.shouldDisable && response.enforcement) {
          const layerId = 'transparent-button-layer-'+Math.ceil(Math.random()*100000);
          elem.attr('disable-layer', layerId);

          setTimeout(() => {
            const layer = makeLayer(layerId, elem);
            layer.prependTo(elem.parent());
            layer.tooltip({
              title: response.enforcement.tooltip,
              trigger: 'hover',
              placement: attrs.tooltipPosition || 'top'
            });
          }, 1000);
        }
      }
    }
  };
}]);
