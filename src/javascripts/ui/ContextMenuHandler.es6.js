import {assign} from 'lodash';
import $ from 'jquery';

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

const TRIGGER_SELECTOR = '[cf-context-menu-trigger]';
const MENU_SELECTOR = '[cf-context-menu]';

let currentOpenMenu = null;

export default function attach ($document) {
  $document.on('click', handleClick);
  return function detach () {
    $document.off('click', handleClick);
  };
}

// Close the open menu and open a menu if a menu trigger is clicked.
function handleClick (event) {
  const $trigger = getMenuTrigger($(event.target));
  let toOpen;

  // If the click is on a menu trigger we open the menu if it is not
  // open yet.
  if ($trigger && !elementDisabled($trigger)) {
    const menu = getAttachedMenu($trigger);
    event.preventDefault();
    if (menu && !menu.data('menuOpen')) {
      toOpen = menu;
    }
  }

  if (currentOpenMenu) {
    closeMenu(currentOpenMenu);
  }
  if (toOpen) {
    openMenu(toOpen);
  }
  currentOpenMenu = toOpen;
}

function closeMenu ($menu) {
  // Close the menu itself and all the menues it is nested in
  $menu.parents(MENU_SELECTOR).addBack()
  // TODO remove this duplication if QA does not use the selector
  .attr('data-menu-state', 'closed')
  .data('menuOpen', false)
  .hide();
}

function openMenu ($menu) {
  // Open the menu itself and all the menues it is nested in
  $menu.parents(MENU_SELECTOR).addBack()
  // TODO remove this duplication if QA does not use the selector
  .attr('data-menu-state', 'opened')
  .data('menuOpen', true)
  .show();
  repositionMenu($menu);
}

function getMenuTrigger ($el) {
  return getElement($el.closest(TRIGGER_SELECTOR));
}

function getAttachedMenu ($trigger) {
  return getElement($trigger.nextAll(MENU_SELECTOR));
}

function getElement ($el) {
  return $el && $el.length ? $el.first() : null;
}

function elementDisabled ($el) {
  return $el.attr('aria-disabled') === 'true' || $el.prop('disabled');
}


function repositionMenu ($menu) {
  const position = $menu.attr('cf-context-menu');
  const $trigger = $menu.prevAll(TRIGGER_SELECTOR).first();
  $menu.css({
    top: '',
    bottom: '',
    left: '',
    right: ''
  }).position(
    assign(getPositioning(position), {
      of: $trigger
    })
  );

  const arrowClass = $menu.position().top < $trigger.position().top
    ? 'x--arrow-down'
    : 'x--arrow-up';

  $menu.removeClass('x--arrow-down x--arrow-up');
  $menu.addClass(arrowClass);
}

function getPositioning (position) {
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
      my: 'right top',
      at: 'right bottom+13'
    },
    /** Why 'fit' for `collsion`? On zoom levels above and below 100% (but not at all levels) the
        user account dropdown was being positioned outside the app window
     **/
    'bottom-right-fit': {
      my: 'right top',
      at: 'right bottom+13',
      collision: 'fit'
    },
    'bottom-left': {
      my: 'left top',
      at: 'left bottom+13'
    },
    // For context menu without arrow (should become the new standard in the future).
    'bottom-left-0': {
      my: 'left top',
      at: 'left bottom'
    },
    'left': {
      my: 'right top-10',
      at: 'left top'
    }
  }[position];
}
