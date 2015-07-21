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
 * <div cf-context-menu>
 *   ...
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
 * <div cf-context-menu="top">
 *   ...
 * </div>
 * ~~~
 */
.provider('contextMenu', [function contextMenuProvider() {

  var enabled = true;
  var detach;

  this.disable = function () {
    enabled = false;
  };

  this.enable = function () {
    enabled = true;
  };

  this.$get = ['$document', function ($document) {
    return {
      attach: attach,
      init: function () {
        if (!enabled) return;
        detach = attach($document);
        return detach;
      }
    };
  }];


  var currentOpenMenu = null;
  var TRIGGER_SELECTOR = '[cf-context-menu-trigger]';
  var MENU_SELECTOR = '[cf-context-menu]';

  function attach ($document) {
    $document.on('click', handleClick);
    return function detach () {
      $document.off('click', handleClick);
    };
  }


  function handleClick (event) {
    var target = event.target;
    var menu = getAttachedMenu(target);
    if (menu) {
      event.preventDefault();
    }
    if (sameNode(menu, currentOpenMenu)) {
      closeMenu(currentOpenMenu);
    } else if (menu) {
      if (!isParent(currentOpenMenu, menu)) {
        closeMenu(currentOpenMenu);
      }
      openMenu(menu);
    } else if (currentOpenMenu) {
      closeMenu(currentOpenMenu);
    }
  }

  function sameNode($a, $b) {
    return $a && $b && $a.get(0) === $b.get(0);
  }

  function closeMenu ($menu) {
    if ($menu) {
      $menu.parents(MENU_SELECTOR).andSelf().hide();
    }
    currentOpenMenu = null;
  }

  function openMenu ($menu) {
    $menu.parents(MENU_SELECTOR).andSelf().show();
    repositionMenu($menu);
    currentOpenMenu = $menu;
  }

  function getAttachedMenu (trigger) {
    var $trigger = $(trigger).closest(TRIGGER_SELECTOR);
    var $menu = $trigger.nextAll(MENU_SELECTOR).first();
    if ($menu.length) {
      return $menu;
    } else {
      return null;
    }
  }

  function isParent(maybeParent, child) {
    return child.parents().index(child.get(0)) >= 0;
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
