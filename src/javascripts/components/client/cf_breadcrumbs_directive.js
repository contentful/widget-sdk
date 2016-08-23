'use strict';

/**
 * @ngdoc directive
 * @name cfBreadcrumbs
 *
 * @property {boolean} topState  Is true if there is only one
 * breadcrumb. This breadcrumb is associated to the current page.
 */
angular.module('contentful').directive('cfBreadcrumbs', ['require', function (require) {
  var $parse = require('$parse');
  var $state = require('$state');
  var analytics = require('analytics');
  var $document = require('$document');
  var contextHistory = require('contextHistory');

  var backBtnSelector = '[aria-label="breadcrumbs-back-btn"]';
  var ancestorBtnSelector = '[aria-label="breadcrumbs-ancestor-btn"]';
  var ancestorMenuContainerSelector = '[aria-label="breadcrumbs-ancestor-menu-container"]';
  var ancestorMenuSelector = '[aria-label="breadcrumbs-ancestor-menu"]';
  var ancestorLinkSelector = ancestorMenuSelector + ' [role="link"]';
  var hintDismissBtnSelector = '[aria-label="ui-hint-dismiss-btn"]';

  var analyticsData = {
    clickedOn: {
      BACK: 'back',
      ANCESTOR: 'ancestor',
      TOP_STATE: 'topState'
    },
    appSection: {
      ContentType: 'contentModel',
      Entries: 'content',
      Assets: 'media',
      CDAKeys: 'apis.cda',
      CMAKeys: 'apis.cma',
      Locales: 'settings.locales',
      Roles: 'settings.roles',
      Webhooks: 'settings.webhooks',
      PreviewEnvironments: 'settings.contentPreview'
    }
  };

  return {
    template: JST.cf_breadcrumbs(),
    restrict: 'E',
    replace: true,
    scope: {
      backHint: '@',
      ancestorHint: '@'
    },
    link: function ($scope, $el) {
      $el.on('click', backBtnSelector, goBackToPreviousPage);

      $el.on('click', ancestorBtnSelector, toggleAncestorList);

      $el.on('click', ancestorLinkSelector, trackAncestorLinkClickAndToggleList);

      document.addEventListener('click', closeAncestorListIfVisible, true);

      $scope.$on('$destroy', function () {
        $el.off('click', goBackToPreviousPage);
        $el.off('click', toggleAncestorList);
        $el.off('click', toggleAncestorList);
        document.removeEventListener('click', closeAncestorListIfVisible, true);
      });

      function track (clickedOn) {
        analytics.track('navigation-control', {
          clickedOn: clickedOn,
          appSection: analyticsData.appSection[$scope.crumbs[0].type]
        });
      }

      function isTopState (sref) {
        return /list(\(\))?$/.test(sref);
      }

      function goBackToPreviousPage () {
        var crumbs = $scope.crumbs;
        var link = crumbs[crumbs.length - 2].link;

        track(analyticsData.clickedOn.BACK);
        $state.go(link.state, link.params || {});
        dismissHints();
      }

      function toggleAncestorList () {
        var $ancestorBtn = $el.find(ancestorBtnSelector);
        var $ancestorList = $el.find(ancestorMenuContainerSelector);
        var $ancestorMenu = $el.find(ancestorMenuSelector);
        var menuAriaHidden = $ancestorMenu.attr('aria-hidden');

        $ancestorBtn.toggleClass('btn__active');
        $ancestorList.toggle();

        $ancestorMenu.attr('aria-hidden', !$parse(menuAriaHidden)());
        dismissHints();
      }

      function trackAncestorLinkClickAndToggleList (e) {
        var sref = $(e.target).attr('ui-sref');
        var clickedOn = isTopState(sref) ? analyticsData.clickedOn.TOP_STATE : analyticsData.clickedOn.ANCESTOR;

        track(clickedOn);
        toggleAncestorList(e);
      }

      function closeAncestorListIfVisible (e) {
        var $ancestorList = $el.find(ancestorMenuContainerSelector);
        var isAncestorBtn = e.target.getAttribute('aria-label') === 'breadcrumbs-ancestor-btn';

        if ($ancestorList.is(':visible') && !isAncestorBtn) {
          toggleAncestorList();
        }
      }

      function dismissHints () {
        $el.find(hintDismissBtnSelector).click();
      }
    },
    controller: ['$scope', function ($scope) {
      /*
       * TODO(mudit): When building the hierarchical navigation,
       * this will turn into an object that will hold the tree
       * rooted at the entry you started from.
       * The nodes in the tree will be linked entries/assets/whatever
       * This will be resolved only once which will be when the user
       * navigates to an entry from the Content page (entry list).
       * It's an array right now as "breadcrumbs" are linear in shape.
       */
      $scope.crumbs = [];

      $scope.$watchCollection(contextHistory.getAll, function (items) {
        var last = items[items.length - 1];

        $scope.crumbs = items.map(function (item) {
          var type = item.getType();

          return {
            getTitle: item.getTitle,
            link: item.link,
            type: type
          };
        });

        $scope.crumbs.hide = $scope.crumbs.length <= 1;
        $scope.crumbs.isExactlyOneLevelDeep = $scope.crumbs.length === 2;
        $scope.crumbs.isMoreThanALevelDeep = $scope.crumbs.length > 2;
        $scope.crumbs.isAtLeastOneLevelDeep = $scope.crumbs.length >= 2;

        $scope.crumbs.backHint = $scope.backHint || 'You can go back to the previous page';
        $scope.crumbs.ancestorHint = $scope.ancestorHint || 'You can view the list of previous pages';

        // set document title as the title of the page the user is on
        // TODO(mudit): Browser is mapping the wrong title to the wrong page
        // when you see the list of things you can go back to on long pressing
        // the browser back button. Fix it.
        // TODO(mudit): This doesn't belong here. Move this out into a service
        // or something.
        if (last) {
          $document[0].title = last.getTitle();
        }
      });
    }]
  };
}]);
