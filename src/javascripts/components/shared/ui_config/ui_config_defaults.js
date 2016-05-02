'use strict';
/**
 * @ngdoc service
 * @name uiConfig/defaults
 *
 * @description
 * This service generates the default uiConfig lists for the entry and assets views
*/

angular.module('contentful')
.factory('uiConfig/defaults', ['$injector', function ($injector) {

  var random       = $injector.get('random');
  var mimetype     = $injector.get('mimetype');
  var systemFields = $injector.get('systemFields');
  var defaultOrder = systemFields.getDefaultOrder();

  return {
    getEntryViews: getEntryViews,
    getAssetViews: getAssetViews,
    createContentTypeView: createContentTypeView
  };

  function getEntryViews(contentTypes) {
    return [
      {
        id: 'default',
        title: 'Views',
        views: [{
          id: random.id(),
          title: 'All',
          order: defaultOrder,
          displayedFieldIds: getDefaultFieldIds()
        }]
      },
      {
        id: random.id(),
        title: 'Status',
        views: [
          createEntryStatusView('Published', 'status:published'),
          createEntryStatusView('Changed', 'status:changed'),
          createEntryStatusView('Draft', 'status:draft'),
          createEntryStatusView('Archived', 'status:archived')
        ]
      },
      {
        id: random.id(),
        title: 'Content Type',
        views: contentTypeViews(contentTypes)
      }
    ];
  }

  function getAssetViews() {
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
  }

  function createEntryStatusView(title, searchTerm) {
    return {
      title: title,
      searchTerm: searchTerm,
      id: random.id(),
      order: defaultOrder,
      displayedFieldIds: getDefaultFieldIds()
    };
  }

  function getDefaultFieldIds() {
    return _.reject(_.map(systemFields.getList(), 'id'), function(fieldId) {
      return _.contains(['createdAt', 'publishedAt'], fieldId);
    });
  }

  function contentTypeViews(contentTypes) {
    return _.map(contentTypes, function (contentType) {
      return createContentTypeView(contentType);
    });
  }

  function createContentTypeView(contentType) {
    return {
      title: contentType.data.name,
      contentTypeId: contentType.getId(),
      id: random.id(),
      order: defaultOrder,
      displayedFieldIds: getDefaultFieldIds()
    };
  }

  function fileTypeViews() {
    return _.map(mimetype.getGroupNames(), function (name, label) {
      return {
        title: name,
        searchTerm: 'type:'+label,
        id: random.id()
      };
    });
  }

}]);
