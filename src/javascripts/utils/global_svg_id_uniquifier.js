'use strict';

angular.module('cf.utils')
.factory('globalSvgIdUniquifier', [function () {

  var ID_REF_REGEX = /^\s*#(.+)\s*$/;
  var URL_ID_REF_REGEX = /^\s*url\(\s*#(.+)\s*\)\s*$/;

  var countPerId = {};

  return {
    /**
     * @param {Element} $svg
     * @returns {Element}
     * @description
     * Takes an (SVG) `Element` and modifies all its child elements `id` attributes
     * to ensure that they are unique amongst all `Element`s previously returned by
     * this function. All SVG specific attributes referencing `id`s of the same SVG
     * will also be updated. References to `id`s not found within the `Element`
     * won't be touched.
     */
    uniquifyIds: uniquifyIds
  };

  function uniquifyIds (svgElem) {
    if (!(svgElem instanceof Element)) {
      throw new Error('`svgElem` is expected to be an `Element`');
    }
    var idMap = {};

    _.each(svgElem.querySelectorAll('[id]'), updateIdAttribute);
    _.each(svgElem.getElementsByTagName('use'), updateXlinkHrefIdRef);
    _.each(svgElem.querySelectorAll('[filter],[mask]'), function (elem) {
      updateUrlIdRef(elem, 'filter');
      updateUrlIdRef(elem, 'mask');
    });
    return svgElem;

    function updateIdAttribute (elem) {
      elem.id = newUniqueId(elem.id);
    }

    function updateXlinkHrefIdRef (elem) {
      updateMatchingIdRef(elem, 'xlink:href', ID_REF_REGEX, function (id) {
        return '#' + id;
      });
    }

    function updateUrlIdRef (elem, attrName) {
      updateMatchingIdRef(elem, attrName, URL_ID_REF_REGEX, function (id) {
        return 'url(#' + id + ')';
      });
    }

    function updateMatchingIdRef (elem, attrName, regex, updateRef) {
      var value = elem.getAttribute(attrName) || '';
      value.replace(regex, function (_match, id) {
        var newId = idMap[id];
        if (newId) {
          elem.setAttribute(attrName, updateRef(newId));
        }
      });
    }

    function newUniqueId (id) {
      countPerId[id] = ++countPerId[id] || 0;
      var newId = 'cf-svg__' + id + '--' + countPerId[id];
      idMap[id] = newId;
      return newId;
    }
  }

}]);
