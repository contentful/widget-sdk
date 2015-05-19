'use strict';

/**
 * @ngdoc directive
 * @name cfDropdownMenu
 *
 * @usage[html]
 * <button cf-dropdown-toggle="contentTypeEditor.actions"></button>
 * <div cf-dropdown-menu="contentTypeEditor.actions">...</div>
 *
 * @description
 * This directive will be triggered by a `cfDropdownToggle` directive, with the
 * same id. Ids are global to the app but can and should be namespaced according to
 * the page or section of the app.
 *
 * Other attributes can be specified either in the same element where
 * `cf-dropdown-menu` is being applied, or in children elements.
 *
 * ### cf-dropdown-position
 * Should be present in the same element as `cf-dropdown-menu`. Takes one of the
 * following values:
 * - fixed (this is a special parameter which means you will position the menu
 *   via CSS and the directive won't apply any positioning)
 * - top15center
 * - topcenter
 * - top
 * - right
 * - left
 * - bottomcenter
 * - topright
 *
 * Additional values can be added and details checked in the `getPosition` method.
 *
 * ### cf-dropdown-collision
 * If present, its value is passed to the jQuery UI collision parameter (see [http://api.jqueryui.com/position/](http://api.jqueryui.com/position/))
 *
 * ### cf-dropdown-close
 * Should be applied to any child elements that when clicked will close the dropdown.
 *
 * ### cf-dropdown-arrow
 * If present it will be used as the visual arrow at the top of the menu.
 *
 * **At the moment only the top arrow is supported**
 *
 * ### Carets and styling
 *
 * The directive will automatically apply `*-aligned` classes and, if an arrow is not used,
 * `*-caret` classes, which will define the place where a caret will be shown.
 *
 * If you wish to use the old style dropdowns with carets, make sure you apply a `dropdown-menu`
 * class to the same element where this directive is applied. Otherwise, you can use a
 * `cf-dropdown-arrow` and the styles defined in `cfnext-dropdown`
 *
*/
angular.module('contentful').directive('cfDropdownMenu', ['$document', function($document) {
  return {
    restrict: 'A',
    link: function(scope, dropdownElement, attrs) {
      var id = attrs.cfDropdownMenu;
      var isOpen;
      var toggleElement;

      if(_.isEmpty(id)){
        throw new Error('cfDropdownMenu: please specify an id for a dropdown');
      }

      scope.$on('dropdownToggle', dropdownToggleHandler);

      scope.$on('$destroy', function () {
        $document.unbind('click', clickOutsideHandler);
        toggleElement = null;
      });

      dropdownElement.find('[cf-dropdown-close]').click(function () {
        closeDropdown();
      });

      // Initial state
      closeDropdown();

      function dropdownToggleHandler(event, toggledId, _toggleElement) {
        if(toggledId === id){
          if(!isOpen){
            toggleElement = toggleElement || _toggleElement;
            openDropdown();
          } else if(isOpen) {
            closeDropdown();
          }
        }
      }

      function openDropdown() {
        dropdownElement.show();
        repositionMenu();
        isOpen = true;
        $document.bind('click', clickOutsideHandler);
      }

      function closeDropdown() {
        dropdownElement.hide();
        isOpen = false;
        $document.unbind('click', clickOutsideHandler);
      }

      function clickOutsideHandler(event) {
        if (isClickOutside(event.target) && isOpen) scope.$apply(function() {
          closeDropdown();
        });
      }

      function isClickOutside(target) {
        var targetParents         = $(target).parents();
        var clickIsOutsideElement = targetParents.index(dropdownElement) !== -1;
        var clickIsOnToggle       = toggleElement && target === toggleElement.get(0);
        var clickIsInsideToggle   = toggleElement && toggleElement.children().index($(target)) !== -1;
        var clickIsOnElement      = target === dropdownElement[0];
        var clickIsInsideElement  = dropdownElement.children().index($(target)) !== -1;
        return !clickIsOutsideElement &&
               !clickIsOnToggle &&
               !clickIsInsideToggle &&
               !clickIsOnElement &&
               !clickIsInsideElement;
      }

      /**
       * Repositions the menu container element after it is made visible
      */
      function repositionMenu() {
        if (skipPositioning()) return;
        resetPosition();
        dropdownElement
        .position(
          _.extend(getPositioning(), {
            of: toggleElement,
            collision: dropdownElement.attr('cf-dropdown-collision') || 'flipfit',
            using: applyPosition
          })
        );
      }

      function skipPositioning() {
        return dropdownElement.attr('cf-dropdown-position') == 'fixed';
      }

      function resetPosition() {
        dropdownElement.css({
          top:    '',
          bottom: '',
          left:   '',
          right:  ''
        }).removeClass(function (index, oldClass) {
          return _.filter(oldClass.split(' '), function (className) {
            return className.match(/(top|bottom|left|right)-caret$|-aligned$/);
          }).join(' ');
        });
      }

      function getPositioning() {
        var position = dropdownElement.attr('cf-dropdown-position');
        switch (position) {
          case 'top15center':
            return {
              my: 'center bottom',
              at: 'center top-15'
            };
          case 'topcenter':
            return {
              my: 'center bottom',
              at: 'center top'
            };
          case 'top':
            return {
              my: 'left bottom',
              at: 'left top'
            };
          case 'right':
            return {
              my: 'left top',
              at: 'right top'
            };
          case 'left':
            return {
              my: 'right top-10',
              at: 'left top'
            };
          case 'bottomcenter':
            return {
              my: 'center top',
              at: 'center bottom'
            };
          case 'topright':
            return {
              my: 'left-20 bottom',
              at: 'left top'
            };
          default:
            return {
              my: 'left top',
              at: 'left bottom'
            };
        }
      }

      /**
       * Method passed along to the jquery ui position method for applying
       * positioning properties
      */
      function applyPosition(pos, info) {
        var $menu = info.element.element;
        //console.log('original position', pos, info);
        var caretDirection = getCaretDirection(pos, info);
        var arrow = $menu.find('[cf-dropdown-arrow]');
        if (caretDirection == 'horizontal') {
          if(arrow.get(0)){
            arrow.addClass(info.horizontal + '-aligned');
          } else {
            $menu.addClass(info.vertical + '-caret ' + info.horizontal + '-aligned');
          }
          if (info.vertical == 'top') {
            pos.top += 10;
          } else {
            pos.top -= 10;
          }
        } else if (caretDirection == 'vertical') {
          if(arrow.get(0)){
            arrow.addClass(info.vertical+ '-aligned');
          } else {
            $menu.addClass(info.horizontal + '-caret ' + info.vertical + '-aligned');
          }
          if (info.horizontal == 'left') {
            pos.left += 20;
          } else {
            pos.left -= 20;
          }
        }
        //console.log('new position', pos, info);
        $menu.css(pos);
      }

      function getCaretDirection(pos, info) {
        if (info.element.top + info.element.height <= info.target.top)
          return 'horizontal'; // above
        else if (info.target.top+info.target.height <= info.element.top)
          return 'horizontal'; // below
        else if (info.element.left+info.element.width <= info.target.left)
          return 'vertical'; // left
        else if (info.target.left+info.target.width <= info.element.left)
          return 'vertical'; // right
        else
          return 'float';
      }

    }
  };
}]);

