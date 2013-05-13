'use strict';

angular.module('contentful/controllers').controller('TabViewCtrl', function ($scope, authentication, analytics) {
  $scope.visitView = function(viewType) {
    var options;
    if (viewType == 'entry-list'){
      options = {
        viewType: 'entry-list',
        section: 'entries',
        hidden: true,
        params: {
          bucketId: $scope.bucketContext.bucket.getId(),
          list: 'all'
        },
        title: 'Entries',
        canClose: true
      };
      analytics.track('Clicked "Entries"');
    } else if (viewType == 'entry-type-list'){
      options = {
        viewType: 'entry-type-list',
        section: 'entryTypes',
        hidden: true,
        title: 'Content Model',
        canClose: true
      };
      analytics.track('Clicked "Content Model"');
    } else if (viewType == 'bucket-settings'){
      options = {
        viewType: 'iframe',
        section: 'bucketSettings',
        hidden: true,
        params: {
          url: authentication.bucketSettingsUrl($scope.bucketContext.bucket.getId()),
          fullscreen: true
        },
        title: 'Settings'
      };
      analytics.track('Clicked "Bucket Settings"');
    } else if (viewType == 'content-delivery') {
      options = {
        viewType: 'content-delivery',
        section: 'contentDelivery',
        hidden: true,
        title: 'Content Delivery',
        canClose: true
      };
      analytics.track('Clicked "Content Delivery"');
    }

    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });

    tab = tab || $scope.bucketContext.tabList.add(options);
    tab.activate();
  };
});
