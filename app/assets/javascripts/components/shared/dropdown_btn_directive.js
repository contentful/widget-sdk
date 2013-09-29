'use strict';

angular.module('contentful').directive('dropdownBtn', function($parse) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      var onClose = attrs.onClose ? $parse(attrs.onClose) : undefined;

      var isOpen = false;

      var open = function() {
        if (isDisabled()) return;
        isOpen = true;
      };

      var close = function() {
        isOpen = false;
        if(onClose) onClose(scope);
      };

      var toggle = function() {
        if (isOpen) close(); else open();
      };

      var isDisabled = function () {
        return element.find('.dropdown-toggle[disabled]').length > 0;
      };

      element.find('.dropdown-toggle').click(function(event) {
        event.preventDefault();
        scope.$apply(toggle);
      });

      scope.$watch(function dropDownIsOpenWatcher(){
        return isOpen;
      }, function(isOpen) {
        var button = element;
        var content = element.find('.dropdown-menu');
        if (isOpen) {
          button.addClass('active');
          content.show();
          repositionMenu();
          $(document).on('click', closeOtherDropdowns);
        } else {
          button.removeClass('active');
          content.hide();
          $(document).off('click', closeOtherDropdowns);
        }
      });

      var closeOtherDropdowns = function(event) {
        var targetParents = $(event.target).parents();
        var inside = targetParents.index(element) !== -1;
        var on     = event.target === element[0];
        var clickOutside = !inside && !on;

        var dropdownClose = $(event.target).attr('dropdown-close') !== undefined ||
                            $(event.target).parents('[dropdown-close]').length > 0;
        var clickOnClose = inside && dropdownClose;

        if (clickOutside || clickOnClose) scope.$apply(function() {
          close();
        });
      };

      function repositionMenu() {
        if (skipPositioning()) return;
        resetPosition();
        element.find('.dropdown-menu').position(_.extend(getPositioning(),{
          of: element.find('.dropdown-toggle'),
          collision: 'flipfit',
          using: applyPosition,
          within: getMenuContainer()
        }));
      }

      function resetPosition() {
        element.find('.dropdown-menu').css({
          top:    '',
          bottom: '',
          left:   '',
          right:  ''
        }).removeClass(function (index, oldClass) {
          return _.filter(oldClass.split(' '), function (className) {
            return className.match(/-caret$|-aligned$/);
          }).join(' ');
        });
      }

      function applyPosition(pos, info) {
        var $menu = info.element.element;
        //console.log('original position', pos, info);
        var caretDirection = getCaretDirection(pos, info);
        if (caretDirection == 'horizontal') {
          $menu.addClass(info.vertical + '-caret ' + info.horizontal + '-aligned');
          if (info.vertical == 'top') {
            pos.top += 10;
          } else {
            pos.top -= 10;
          }
        } else if (caretDirection == 'vertical') {
          $menu.addClass(info.horizontal + '-caret ' + info.vertical + '-aligned');
          if (info.horizontal == 'left') {
            pos.left += 10;
          } else {
            pos.left -= 10;
          }
        }
        //console.log('new position', pos, info);
        $menu.css(pos);
      }

      function skipPositioning() {
        return element.find('.dropdown-menu').hasClass('fixed-position');
      }

      function getPositioning() {
        var position = element.find('.dropdown-menu').attr('position');
        switch (position) {
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
              my: 'right top',
              at: 'left top'
            };
          //case 'bottom': == default
          default:
            return {
              my: 'left top',
              at: 'left bottom'
            };
        }
      }

      function getMenuContainer() {
        var selector = element.find('.dropdown-menu').attr('container') || '.tab-main';
        var container = element.parents(selector);
        if (container.length !== 0) {
          return container;
        }
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
});

