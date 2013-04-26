'use strict';

angular.module('contentful/controllers').controller('TabViewCtrl', function ($scope, authentication) {
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
    } else if (viewType == 'entry-type-list'){
      options = {
        viewType: 'entry-type-list',
        section: 'entryTypes',
        hidden: true,
        title: 'Content Model',
        canClose: true
      };
    } else if (viewType == 'bucket-settings'){
      options = {
        viewType: 'iframe',
        section: 'bucketSettings',
        params: {
          url: authentication.bucketSettingsUrl($scope.bucketContext.bucket.getId()),
          fullscreen: true
        },
        title: 'Settings'
      };
    } else if (viewType == 'content-delivery') {
      options = {
        viewType: 'content-delivery',
        section: 'contentDelivery',
        hidden: true,
        title: 'Content Delivery',
        canClose: true
      };
    } else if (viewType == 'api-key-editor') {
      options = {
        viewType: 'api-key-editor',
        section: 'contentDelivery',
        hidden: true,
        title: 'API Key',
        canClose: true
      };
    }

    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });

    tab = tab || $scope.bucketContext.tabList.add(options);
    tab.activate();
  };
});
