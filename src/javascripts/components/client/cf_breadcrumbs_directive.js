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
  var Analytics = require('analytics/Analytics');
  var contextHistory = require('navigation/ContextHistory').default;
  var documentTitle = require('navigation/DocumentTitle');
  var K = require('utils/kefir');

  var backBtnSelector = '[aria-label="breadcrumbs-back-btn"]';
  var ancestorBtnSelector = '[aria-label="breadcrumbs-ancestor-btn"]';
  var ancestorMenuContainerSelector = '[aria-label="breadcrumbs-ancestor-menu-container"]';
  var ancestorMenuSelector = '[aria-label="breadcrumbs-ancestor-menu"]';
  var ancestorLinkSelector = ancestorMenuSelector + ' [role="link"]';
  var hintDismissBtnSelector = '[aria-label="ui-hint-dismiss-btn"]';

  var renderString = require('ui/Framework').renderString;
  var template = require('app/Breadcrumbs').template;

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
    template: renderString(template()),
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
        Analytics.track('global:navigated', {
          control: clickedOn,
          section: analyticsData.appSection[$scope.crumbs[0].type]
        });
      }

      function isTopState (sref) {
        return /list(\(\))?$/.test(sref);
      }

      function goBackToPreviousPage () {
        // TODO This code is duplicated in `navigation/closeState`.
        // Maybe the context history is a better place for the shared
        // code.
        contextHistory.pop();

        var link = contextHistory.getLast().link;
        var state = link.state;

        // TODO The `contextHistory` should take care of setting the
        // correct state when a crumb is added.
        if ($state.includes('spaces.detail.environment')) {
          state = state.replace('spaces.detail', 'spaces.detail.environment');
        }

        track(analyticsData.clickedOn.BACK);
        $state.go(state, link.params || {});
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
        toggleAncestorList();
      }

      function closeAncestorListIfVisible (e) {
        var $ancestorList = $el.find(ancestorMenuContainerSelector);
        // IE 11 does not always have a target or getAttribute method :(
        var targetLabel = e.target && e.target.getAttribute && e.target.getAttribute('aria-label');
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
        $scope.shouldShowHierarchy = crumbs.length > 2 && !$state.params.inlineEntryId;
      });
    }]
  };
}]);
