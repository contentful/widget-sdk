'use strict';

/**
 * @ngdoc directive
 * @name cfBreadcrumbs
 *
 * @property {boolean} topState  Is true if there is only one
 * breadcrumb. This breadcrumb is associated to the current page.
 */
angular.module('contentful').directive('cfBreadcrumbs', [
  'require',
  require => {
    const $parse = require('$parse');
    const $state = require('$state');
    const Analytics = require('analytics/Analytics');
    const contextHistory = require('navigation/Breadcrumbs/History').default;
    const documentTitle = require('navigation/DocumentTitle');
    const K = require('utils/kefir');

    const backBtnSelector = '[aria-label="breadcrumbs-back-btn"]';
    const ancestorBtnSelector = '[aria-label="breadcrumbs-ancestor-btn"]';
    const ancestorMenuContainerSelector = '[aria-label="breadcrumbs-ancestor-menu-container"]';
    const ancestorMenuSelector = '[aria-label="breadcrumbs-ancestor-menu"]';
    const ancestorLinkSelector = ancestorMenuSelector + ' [role="link"]';
    const hintDismissBtnSelector = '[aria-label="ui-hint-dismiss-btn"]';

    const renderString = require('ui/Framework').renderString;
    const template = require('navigation/Breadcrumbs/Template').template;

    const analyticsData = {
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
      link: function($scope, $el) {
        $el.on('click', backBtnSelector, goBackToPreviousPage);

        $el.on('click', ancestorBtnSelector, toggleAncestorList);

        $el.on('click', ancestorLinkSelector, handleAncestorLinkClick);

        // using addEventListener as $el.on doesn't support capture mode handler
        document.addEventListener('click', closeAncestorListIfVisible, true);

        $scope.$on('$destroy', () => {
          $el.off('click', goBackToPreviousPage);
          $el.off('click', toggleAncestorList);
          $el.off('click', handleAncestorLinkClick);
          document.removeEventListener('click', closeAncestorListIfVisible, true);
        });

        function track(clickedOn) {
          Analytics.track('global:navigated', {
            control: clickedOn,
            section: analyticsData.appSection[$scope.crumbs[0].type]
          });
        }

        function isTopState(sref) {
          return /list(\(\))?$/.test(sref);
        }

        function goBackToPreviousPage() {
          // TODO This code is duplicated in `navigation/closeState`.
          // Maybe the context history is a better place for the shared
          // code.
          contextHistory.pop();

          const link = contextHistory.getLast().link;
          let state = link.state;

          // TODO The `contextHistory` should take care of setting the
          // correct state when a crumb is added.
          if ($state.includes('spaces.detail.environment')) {
            state = state.replace('spaces.detail', 'spaces.detail.environment');
          }

          track(analyticsData.clickedOn.BACK);
          $state.go(state, link.params || {});
          dismissHints();
        }

        function toggleAncestorList() {
          const $ancestorBtn = $el.find(ancestorBtnSelector);
          const $ancestorList = $el.find(ancestorMenuContainerSelector);
          const $ancestorMenu = $el.find(ancestorMenuSelector);
          const menuAriaHidden = $ancestorMenu.attr('aria-hidden');

          $ancestorBtn.toggleClass('btn__active');
          $ancestorList.toggle();

          $ancestorMenu.attr('aria-hidden', !$parse(menuAriaHidden)());
          dismissHints();
        }

        function trackAncestorLinkClick(e) {
          const sref = $(e.target).attr('ui-sref');
          const clickedOn = analyticsData.clickedOn[isTopState(sref) ? 'TOP_STATE' : 'ANCESTOR'];

          track(clickedOn);
        }

        function handleAncestorLinkClick(e) {
          trackAncestorLinkClick(e);
          toggleAncestorList();
        }

        function closeAncestorListIfVisible(e) {
          const $ancestorList = $el.find(ancestorMenuContainerSelector);
          // IE 11 does not always have a target or getAttribute method :(
          const targetLabel =
            e.target && e.target.getAttribute && e.target.getAttribute('aria-label');
          const isAncestorBtn = targetLabel === 'breadcrumbs-ancestor-btn';

          if ($ancestorList.is(':visible') && !isAncestorBtn) {
            toggleAncestorList();
          }
        }

        function dismissHints() {
          $el.find(hintDismissBtnSelector).click();
        }
      },
      controller: [
        '$scope',
        $scope => {
          $scope.$watch(() => {
            const last = _.last($scope.crumbs);
            return last && last.getTitle();
          }, documentTitle.maybeOverride);

          K.onValueScope($scope, contextHistory.crumbs$, crumbs => {
            $scope.crumbs = crumbs;
            $scope.shouldHide = crumbs.length <= 1;
            $scope.shouldShowBack = crumbs.length >= 2;
            $scope.shouldShowHierarchy = crumbs.length > 2 && !$state.params.inlineEntryId;
          });
        }
      ]
    };
  }
]);
