'use strict';

angular.module('contentful').factory('TabOptionsGenerator', function () {

  function TabOptionsGenerator(clientScope) {
    this.clientScope = clientScope;
  }

  TabOptionsGenerator.prototype = {
    entryEditor: function (entry) {
      return {
        viewType: 'entry-editor',
        section: 'entries',
        params: {
          entry: entry
        },
        //title: this.clientScope.spaceContext.entryTitle(entry)
        // TODO have title and mode set after initialization?
      };
    },

    assetEditor: function (asset) {
      return {
        viewType: 'asset-editor',
        section: 'assets',
        params: {
          asset: asset
        },
        //title: this.clientScope.spaceContext.assetTitle(asset)
        // TODO have title and mode set after initialization?
      };
    },

    contentTypeEditor: function (contentType, mode) {
      return {
        viewType: 'content-type-editor',
        section: 'contentTypes',
        params: {
          contentType: contentType,
          mode: mode
        },
        title: contentType.getName()
        // TODO have title and mode set after initialization?
      };
    },

    editingInterfaceEditor: function (contentType, editingInterface) {
      return {
        viewType: 'editing-interface-editor',
        section: 'contentTypes',
        params: {
          contentType: contentType,
          editingInterface: editingInterface
        },
        title: contentType.getName() +'/'+ editingInterface.data.title
      };
    },

    apiKeyEditor: function (apiKey) {
      return {
        viewType: 'api-key-editor',
        section: 'apiKeys',
        params: {
          apiKey: apiKey,
          mode: 'edit'
        }
        // TODO have title and mode set after initialization?
      };
    },

    entryList: function () {
      return {
        viewType: 'entry-list',
        section: 'entries',
        hidden: true,
        params: {},
        title: 'Entries',
        canClose: true
      };
    },

    assetList: function () {
      return {
        viewType: 'asset-list',
        section: 'assets',
        hidden: true,
        params: {},
        title: 'Assets',
        canClose: true
      };
    },

    contentTypeList: function () {
      return {
        viewType: 'content-type-list',
        section: 'contentTypes',
        hidden: true,
        params: {
          list: 'all'
        },
        title: 'Content Model',
        canClose: true
      };
    },

    spaceSettings: function (pathSuffix) {
      pathSuffix = pathSuffix || 'edit';
      return {
        viewType: 'space-settings',
        section: 'spaceSettings',
        hidden: true,
        params: {
          pathSuffix: pathSuffix
        },
        title: 'Settings'
      };
    },

    apiHome: function () {
      return {
        viewType: 'api-home',
        section: 'apiKeys',
        hidden: true,
        title: 'API',
        canClose: true
      };
    },

    apiKeyList: function () {
      return {
        viewType: 'api-key-list',
        section: 'apiKeys',
        hidden: true,
        title: 'API Keys',
        canClose: true
      };
    },

    contentModel: function () {
      return {
        viewType: 'content-model',
        section: 'apiKeys',
        hidden: true,
        title: 'Content Model',
        canClose: true,
        params: {
          list: 'active'
        }
      };
    },

    forViewType: function (viewType) {
      if (viewType == 'entry-list')       return this.entryList();
      if (viewType == 'asset-list')       return this.assetList();
      if (viewType == 'content-type-list')return this.contentTypeList();
      if (viewType == 'space-settings')   return this.spaceSettings();
      if (viewType == 'api-key-list')     return this.apiKeyList();
      if (viewType == 'api-home') return this.apiHome();
    }

  };

  return new TabOptionsGenerator();
});
