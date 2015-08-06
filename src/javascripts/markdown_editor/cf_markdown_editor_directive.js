'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $rootScope        = $injector.get('$rootScope');
  var modalDialog       = $injector.get('modalDialog');
  var MarkdownEditor    = $injector.get('MarkdownEditor');
  var assetUrl          = $injector.get('$filter')('assetUrl');
  var specialCharacters = $injector.get('specialCharacters');
  var LinkOrganizer     = $injector.get('LinkOrganizer');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {
      field: '=',
      fieldData: '=',
      locale: '=',
      spaceContext: '='
    },
    link: function (scope, el) {
      var textarea = el.find('textarea').get(0);
      var currentMode = 'md';
      var editor = null;

      scope.isInitialized = false;
      scope.firstSyncDone = false;
      scope.hasCrashed = false;
      scope.isReady = isReady;
      scope.preview = '';
      scope.info = {};
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.insertAsset = insertAsset;
      scope.insertLink = insertLink;
      scope.organizeLinks = organizeLinks;
      scope.insertTable = insertTable;
      scope.insertSpecial = insertSpecialCharacter;

      MarkdownEditor.create(textarea).then(function (editorInstance) {
        editor = editorInstance;
        scope.actions = editor.actions;
        scope.$watch('fieldData.value', handleValueChange);
        scope.$on('$destroy', function () {
          editor.destroy();
          scope = null;
        });
      }).catch(function () {
        scope.hasCrashed = true;
      });

      function handleValueChange(value) {
        if (scope.isInitialized) {
          editor.setContent(value);
        } else {
          scope.isInitialized = true;
          editor.setContent(value);
          editor.subscribe(receiveData);
        }
      }

      function receiveData(value, preview, info) {
        scope.$apply(function() {
          scope.fieldData.value = value;
          scope.preview = preview;
          scope.info = info;
          scope.firstSyncDone = true;
        });
      }

      function isReady() {
        return scope.isInitialized && scope.firstSyncDone;
      }

      function setMode(mode) {
        currentMode = _.contains(['md', 'html', 'rich'], mode) ? mode : 'md';
      }

      function inMode(mode) {
        return currentMode === mode;
      }

      function insertAsset() {
        modalDialog.open({
          scope: scope,
          template: 'insert_asset_dialog',
          ignoreEnter: true
        }).promise.then(function (assets) {
          if (_.isEmpty(assets)) { return; }
          var links = _.map(assets, makeAssetLink).join(' ');
          editor.insert(links);
        });
      }

      function makeAssetLink(asset) {
        try {
          asset = localizedAsset(asset);
          return '![' + asset.title + '](' + assetUrl(asset.file.url) + ')';
        } catch (e) {
          return '';
        }
      }

      function localizedAsset(asset) {
        var locale = scope.locale;
        var defaultLocale = scope.spaceContext.defaultLocale;
        var file  = asset.data.fields.file;
        var title = asset.data.fields.title;
        return {
          file:   file[locale.internal_code] ||  file[defaultLocale.internal_code] || _.first(file ),
          title: title[locale.internal_code] || title[defaultLocale.internal_code] || _.first(title)
        };
      }

      function insertLink() {
        modalDialog.open({
          scope: _.extend($rootScope.$new(), { model: {} }),
          template: 'insert_link_dialog',
          ignoreEnter: true
        }).promise.then(function (data) {
          editor.insert(makeLink(data));
        });
      }

      function makeLink(data) {
        if (data.title) {
          return '[' + data.title + '](' + data.url + ')';
        }
        return '<' + data.url + '>';
      }

      function organizeLinks() {
        var text = scope.fieldData.value;
        text = LinkOrganizer.convertInlineToRef(text);
        text = LinkOrganizer.rewriteRefs(text);
        scope.fieldData.value = text;
      }

      function insertSpecialCharacter() {
        var modalScope = $rootScope.$new();
        modalScope.specialCharacters = specialCharacters;
        modalScope.model = { choice: _.first(specialCharacters) };
        modalScope.entity = function (x) { return '&' + x.id + ';'; };

        modalDialog.open({
          scope: modalScope,
          template: 'insert_special_character_dialog',
          ignoreEnter: true
        }).promise.then(editor.insert);
      }

      function insertTable() {
        var modalScope = $rootScope.$new();
        modalScope.model = { rows: 2, cols: 2, width: 10 };

        modalDialog.open({
          scope: modalScope,
          template: 'insert_table_dialog',
          ignoreEnter: true
        }).promise.then(editor.actions.table);
      }
    }
  };
}]);
