'use strict';

/**
 * @ngdoc directive
 * @name cfBreadcrumbs
 *
 * @property {boolean} topState  Is true if there is only one
 * breadcrumb. This breadcrumb is associated to the current page.
 */
angular.module('contentful').directive('cfBreadcrumbs', ['require', function (require) {
  var Logger = require('logger');
  var $parse = require('$parse');
  var $state = require('$state');
  var analytics = require('analytics/Analytics');
  var contextHistory = require('contextHistory');
  var documentTitle = require('navigation/DocumentTitle');
  var K = require('utils/kefir');

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
      ContentTypes: 'contentModel',
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
    scope: {},
    link: function ($scope, $el) {
      $el.on('click', backBtnSelector, goBackToPreviousPage);

      $el.on('click', ancestorBtnSelector, toggleAncestorList);

      $el.on('click', ancestorLinkSelector, handleAncestorLinkClick);

      // using addEventListener as $el.on doesn't support capture mode handler
      document.addEventListener('click', closeAncestorListIfVisible, true);

      $scope.$on('$destroy', function () {
        $el.off('click', goBackToPreviousPage);
        $el.off('click', toggleAncestorList);
        $el.off('click', handleAncestorLinkClick);
        document.removeEventListener('click', closeAncestorListIfVisible, true);
      });

      function track (clickedOn) {
        analytics.track('global:navigated', {
          control: clickedOn,
          section: analyticsData.appSection[$scope.crumbs[0].type]
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

      function trackAncestorLinkClick (e) {
        var sref = $(e.target).attr('ui-sref');
        var clickedOn = analyticsData.clickedOn[isTopState(sref) ? 'TOP_STATE' : 'ANCESTOR'];

        track(clickedOn);
      }

      function handleAncestorLinkClick (e) {
        trackAncestorLinkClick(e);
        toggleAncestorList(e);
      }

      function closeAncestorListIfVisible (e) {
        var $ancestorList = $el.find(ancestorMenuContainerSelector);
        var targetLabel;
        // This might fail on IE. I’m not sure why. Logging should be
        // temporary
        try {
          targetLabel = e.target.getAttribute('aria-label');
        } catch (e) {
          Logger.logWarn('Failed to call "getAttribute()"', {
            error: e,
            data: {
              targetNodeName: e.target.nodeName,
              targetTagName: e.target.tagName
            }
          });
        }
        var isAncestorBtn = targetLabel === 'breadcrumbs-ancestor-btn';

        if ($ancestorList.is(':visible') && !isAncestorBtn) {
          toggleAncestorList();
        }
      }

      function dismissHints () {
        $el.find(hintDismissBtnSelector).click();
      }
    },
    controller: ['$scope', function ($scope) {
      $scope.$watch(function () {
        var last = _.last($scope.crumbs);
        return last && last.getTitle();
      }, documentTitle.maybeOverride);

      K.onValueScope($scope, contextHistory.crumbs$, function (crumbs) {
        $scope.crumbs = crumbs;
        $scope.shouldHide = crumbs.length <= 1;
        $scope.shouldShowBack = crumbs.length >= 2;
        $scope.shouldShowHierarchy = crumbs.length > 2;
      });
    }]
  };
}]);
