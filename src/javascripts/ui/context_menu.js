'use strict';

angular.module('cf.ui')

.directive('cfContextMenu', [function () {
  return {
    link: function (scope, element) {
      element.hide();
    }
  };
}])

/**
 * @ngdoc service
 * @name contextMenu
 * @module cf.ui
 * @description
 * This service is responsible for showing, hiding and positioning
 * context menus.
 *
 * It attaches a global event listener and opens a context menu when an
 * element with the `cf-context-menu-trigger` attribute is clicked. The
 * context menu is the next sibling with the `cf-context-menu`
 * attribute.
 *
 * ~~~html
 * <button cf-context-menu-trigger>Open</button>
 * <div cf-context-menu role="menu">
 *   <button role="menuitem">Action</button>
 * </div>
 * ~~~
 *
 * The context menu will be hidden again when any part of the document
 * is clicked.
 *
 * ## Positioning
 *
 * By default the context menu is positioned to the bottom center of
 * its trigger. The trigger is the previous sibling with the
 * `cf-context-menu-trigger` attribute.
 *
 * Positioning can be customized as follows
 * ~~~html
 * <div cf-context-menu="top" role="menu">
 *   ...
 * </div>
 * ~~~
 */
.factory('contextMenu', ['$injector', function contextMenu ($injector) {
  var $document = $injector.get('$document');

  var TRIGGER_SELECTOR = '[cf-context-menu-trigger]';
  var MENU_SELECTOR = '[cf-context-menu]';

  var currentOpenMenu = null;

  return {
    init: function () {
      return attach($document);
    }
  };


  function attach ($document) {
    $document.on('click', handleClick);
    return function detach () {
      $document.off('click', handleClick);
    };
  }

  function handleClick (event) {
    var $trigger = getMenuTrigger($(event.target));
    var toOpen;

    if ($trigger) {
      var menu = getAttachedMenu($trigger);
      event.preventDefault();
      if (!menu.data('menuOpen')) {
        toOpen = menu;
      }
    }

    closeMenu(currentOpenMenu);
    currentOpenMenu = openMenu(toOpen);
  }

  function closeMenu ($menu) {
    if ($menu) {
      $menu.parents(MENU_SELECTOR).andSelf()
      .data('menuOpen', false)
      .hide();
    }
  }

  function openMenu ($menu) {
    if ($menu) {
      $menu.parents(MENU_SELECTOR).andSelf()
      .data('menuOpen', true)
      .show();
      repositionMenu($menu);
      return $menu;
    }
  }

  function getMenuTrigger ($el) {
    return getElement($el.closest(TRIGGER_SELECTOR));
  }

  function getAttachedMenu ($trigger) {
    return $trigger && getElement($trigger.nextAll(MENU_SELECTOR));
  }

  function getElement ($el) {
    return $el && $el.length ? $el.first() : null;
  }


  function repositionMenu($menu) {
    var position = $menu.attr('cf-context-menu');
    var $trigger = $menu.prevAll(TRIGGER_SELECTOR).first();
    $menu.css({
      top:    '',
      bottom: '',
      left:   '',
      right:  ''
    }).position(
      _.extend(getPositioning(position), {
        of: $trigger,
      })
    );
  }

  function getPositioning(position) {
    position = position || 'bottom';
    return {
      'top': {
        my: 'center bottom',
        at: 'center top-13'
      },
      'top-right': {
        my: 'left-20 bottom',
        at: 'left top-13'
      },
      'bottom': {
        my: 'center top',
        at: 'center bottom+13'
      },
      'bottom-4': {
        my: 'center top',
        at: 'center bottom+8'
      },
      'bottom-right': {
        my: 'left top',
        at: 'left bottom+13'
      },
      'bottom-left': {
        my: 'left top',
        at: 'left bottom+13'
      },
      'left': {
        my: 'right top-10',
        at: 'left top'
      },
    }[position];
  }
}]);
