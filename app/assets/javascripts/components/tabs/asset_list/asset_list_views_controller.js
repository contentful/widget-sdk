'use strict';

angular.module('contentful').controller('AssetListViewsController', ['$scope', '$controller', 'mimetype', 'random', function($scope, $controller, mimetype, random){

  return $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    viewCollectionName: 'assetListViews',
    generateDefaultViews: generateDefaultViews,
    resetList: function () {
      $scope.resetAssets(true);
    }
  });


  function getBlankView() {
    return {
      id: null,
      title: 'New View',
      searchTerm: null
    };
  }

  function generateDefaultViews() {
    return [
      {
        id: 'default',
        title: 'Views',
        views: [{
          id: random.id(),
          title: 'All'
        }]
      },
      {
        id: random.id(),
        title: 'Status',
        views: [
          {title: 'Published', searchTerm: 'status:published', id: random.id()},
          {title: 'Changed',   searchTerm: 'status:changed'  , id: random.id()},
          {title: 'Draft',     searchTerm: 'status:draft'    , id: random.id()},
          {title: 'Archived',  searchTerm: 'status:archived' , id: random.id()}
        ]
      },
      {
        id: random.id(),
        title: 'File Type',
        views: fileTypeViews()
      }
    ];

    function fileTypeViews() {
      return _.map(mimetype.groupDisplayNames, function (name, label) {
        return {
          title: name,
          searchTerm: 'type:'+label,
          id: random.id()
        };
      });
    }

  }

}]);
