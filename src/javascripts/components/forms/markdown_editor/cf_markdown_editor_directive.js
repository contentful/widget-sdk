'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $rootScope        = $injector.get('$rootScope');
  var modalDialog       = $injector.get('modalDialog');
  var MarkdownEditor    = $injector.get('MarkdownEditor');
  var assetUrl          = $injector.get('$filter')('assetUrl');
  var specialCharacters = $injector.get('specialCharacters');
  var LinkOrganizer     = $injector.get('LinkOrganizer');

  return {
    restrict: 'A',
    template: JST['cf_markdown_editor'](),
    scope: {
      field: '=',
      fieldData: '=',
      locale: '=',
      spaceContext: '='
    },
    link: function (scope, el) {
      var textarea = el.find('textarea').get(0);
      var editor = MarkdownEditor.create(textarea);
      var currentMode = 'md';

      scope.isInitialized = false;
      scope.firstSyncDone = false;
      scope.actions = editor.actions;
      scope.preview = '';
      scope.info = {};
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.insertAsset = insertAsset;
      scope.insertLink = insertLink;
      scope.organizeLinks = organizeLinks;
      scope.insertTable = insertTable;
      scope.insertSpecial = insertSpecialCharacter;

      scope.$watch('fieldData.value', handleValueChange);

      scope.$on('$destroy', function() {
        editor.destroy();
        scope = null;
      });

      function handleValueChange(value) {
        if (scope.isInitialized) {
          editor.alterValue(value);
          return;
        }

        scope.isInitialized = true;
        editor.alterValue(value);
        editor.subscribe(receiveData);
      }

      function receiveData(value, preview, info) {
        scope.$apply(function() {
          scope.fieldData.value = value;
          scope.preview = preview;
          scope.info = info;
          scope.firstSyncDone = true;
        });
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
        if (!data.title) { return '<' + data.url + '>'; }
        return '[' + data.title + '](' + data.url + ')';
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
