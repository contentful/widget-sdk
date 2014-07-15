'use strict';
angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function($injector){
  var $document   = $injector.get('$document');
  var $timeout    = $injector.get('$timeout');
  var $window     = $injector.get('$window');
  var delay       = $injector.get('delay');
  var keycodes    = $injector.get('keycodes');
  var modalDialog = $injector.get('modalDialog');
  var marked      = $injector.get('marked');

  return {
    restrict: 'C',
    template: JST['cf_markdown_editor'](),
    link: function(scope, elem){
      var textarea = elem.find('textarea');
      var toolbar = elem.find('.markdown-toolbar');
      var modeSwitch = elem.find('.markdown-modeswitch');
      var preview = elem.find('.markdown-preview');

      scope.metaKey = /(Mac|Macintosh)/gi.test($window.navigator.userAgent) ? 'Cmd' : 'Ctrl';

      // Different display modes: preview, edit, combined
      scope.displayMode = 'edit';

      scope.guideOpen = true;
      scope.toggleGuide = function () {
        scope.guideOpen = !scope.guideOpen;
      };

      scope.inPreviewMode = function () {
        return scope.displayMode == 'preview';
      };

      scope.inEditMode = function () {
        return scope.displayMode == 'edit';
      };

      scope.toggleDisplayMode = function () {
        $timeout(function () {
          if (scope.inPreviewMode()) {
            scope.displayMode = 'edit';
          } else {
            scope.displayMode = 'preview';
          }
        }, 500);
      };

      scope.enterEditor = function (ev) {
        if (scope.displayMode === 'preview') {
          var targetText = $(ev.target).text().trim();
          scope.displayMode = 'edit';
          textarea.trigger('autosize');
          delay(function () {
            textarea.trigger('focus');
            var cursorPos = textarea.val().indexOf(targetText);
            textarea.textrange('setcursor', cursorPos);
          }, 200);
        }
      };

      textarea.on('focus', function () {
        toolbar.addClass('opaque');
        modeSwitch.addClass('opaque');
      });

      textarea.on('blur', function () {
        toolbar.removeClass('opaque');
        modeSwitch.removeClass('opaque');
        triggerUpdateEvents();
      });

      textarea.on('keydown', function (ev) {
        if(ev.altKey && ev.shiftKey && ev.keyCode === keycodes.TAB){
          ev.preventDefault();
          ev.stopPropagation();
          scope.indent();
        }
      });

      function isPreviewKey(ev) {
        return ev.metaKey && ev.shiftKey && ev.keyCode === keycodes.P;
      }

      function toggleKeyboardPreview(ev) {
        if(isPreviewKey(ev) && (
          ev.target === textarea.get(0) ||
          ev.target === preview.get(0)
        )){
          ev.preventDefault();
          scope.toggleDisplayMode();
          scope.$digest();
          $timeout(function () {
            if(scope.inPreviewMode()) preview.focus();
            else textarea.focus();
          }, 500);
        }
      }

      $document.on('keydown', toggleKeyboardPreview);
      scope.$on('$destroy', function () {
        $document.off('keydown', toggleKeyboardPreview);
      });

      function toggleWrapper(wrapper, wrapperRegex) {
        var regexp = new RegExp('^'+wrapperRegex+'([^*]+)'+wrapperRegex+'$');
        var range = textarea.textrange('get');
        if (range.length === 0) return;
        var text = range.text;
        var match = text.match(regexp);

        if (match) {
          textarea.textrange('replace', match[1]);
        } else {
          textarea.textrange('replace', wrapper+text+wrapper);
        }
        triggerUpdateEvents();
      }

      scope.toggleBold = function () { toggleWrapper('**', '\\*\\*'); };
      scope.toggleItalic = function () { toggleWrapper('*', '\\*'); };

      scope.indent = function () {
        var range = textarea.textrange('get');
        if(!isLineStart(range)){
          textarea.textrange('setcursor', range.start);
        }
        textarea.textrange('replace', mapLines(range.text, function (line) {
          return '  ' + line;
        }));
        textarea.textrange('setcursor', range.start + 2);
      };

      scope.toggleHeadline = function (level) {
        var range = lineRange();
        var match = range.text.match(/^#+ /);
        var afterPosition;

        if (match) {
          var currentLevel = match[0].length - 1;
          afterPosition = range.end - currentLevel - 1;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.substr(currentLevel + 1);
          }));
        } else {
          afterPosition = range.end + level + 1;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return '######'.substr(0, level) + ' ' + line;
          }));
        }
        textarea.textrange('setcursor', afterPosition);
      };

      var ulPrefix = /^-+ /;
      var olPrefix = /^(\d+)\. /;

      scope.toggleUnorderedList = function () {
        var range = lineRange();
        var afterPosition;

        if (ulPrefix.test(range.text)) {
          afterPosition = range.end - 2;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.replace(ulPrefix, '');
          }));
        } else if(olPrefix.test(range.text)) {
          afterPosition = range.end - 1;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.replace(olPrefix, '- ');
          }));
        } else {
          afterPosition = range.end + 2;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return '- ' + line;
          }));
        }
        triggerUpdateEvents();
        textarea.textrange('setcursor', afterPosition);
      };

      scope.toggleOrderedList = function () {
        var range = lineRange();
        var afterPosition;

        if (olPrefix.test(range.text)) {
          afterPosition = range.end - 3;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.replace(olPrefix, '');
          }));
        } else {
          var lineNum = 0;
          afterPosition = range.end + (ulPrefix.test(range.text) ? 1 : 3);
          textarea.textrange('replace', mapLines(range.text, function (line) {
            lineNum++;
            if(ulPrefix.test(range.text)) {
              return line.replace(ulPrefix, lineNum + '. ');
            } else {
              return '' + lineNum + '. ' + line;
            }
          }));
        }
        triggerUpdateEvents();
        textarea.textrange('setcursor', afterPosition);
      };

      scope.insertRule = function () {
        var range = lineRange();
        textarea.textrange('replace', range.text + '\n\n___');
        textarea.textrange('set', range.end, 0);
        triggerUpdateEvents();
      };

      scope.toggleBlockQuote = function () {
        var range = lineRange();
        var quote = range.text.split('\n').map(function (line) {
          return '> '+line;
        }).join('\n');
        textarea.textrange('replace', quote);
        triggerUpdateEvents();
        textarea.textrange('setcursor', range.end + 1);
      };

      scope.addCodeblock = function () {
        var range = lineRange();
        textarea.textrange('replace', '```\n' + range.text + '\n```');
        triggerUpdateEvents();
        textarea.textrange('setcursor', range.start + 4);
      };

      scope.insertAsset = function () {
        modalDialog.open({
          scope: scope,
          template: 'insert_asset_dialog'
        }).then(function (assets) {
          if (_.isEmpty(assets)) return;
          var links = _.map(assets, makeAssetLink).join('\n');
          var range = lineRange();
          textarea.textrange('replace', range.text + '\n\n'+links+'\n');
          textarea.textrange('set', range.end, 0);
          triggerUpdateEvents();
        });
      };

      // Helpers ///////////////////////////////////////////

      function lineRange() {
        var range = textarea.textrange('get');
        var lines = entireLines(range);
        textarea.textrange('set', lines.start, lines.length);
        return textarea.textrange('get');
      }

      function mapLines(lines, mapFn) {
        return lines.split('\n').map(mapFn).join('\n');
      }

      function entireLines(range) {
        range = _.cloneDeep(range);
        var text = textarea.val();
        while(true) {
          if (range.start === 0) break;
          if (text[range.start-1].match(/\r?\n/)) break;
          range.start--;
          range.length++;
        }

        while(true) {
          if (range.end === text.length) break;
          if (text[range.end].match(/\r?\n/)) break;
          range.end++;
          range.length++;
        }

        range.text = text.substr(range.start, range.length);

        return range;
      }

      function isLineStart(range) {
        var position = range.position-1;
        if(position > 0 && textarea.val()[position] === '\n') return true;
        var chr;
        while(position > 0 && (chr = textarea.val()[position])){
          if(chr === ' ') position--;
          else if(chr === '\n') return true;
          else return false;
        }
        return false;
      }

      function triggerUpdateEvents() {
        textarea.trigger('input').trigger('autosize');
        textarea[0].dispatchEvent(new Event('paste'));
      }

      function makeAssetLink(asset) {
        try {
          asset = localizedAsset(asset, scope.locale);
          return '!['+asset.title+']('+asset.file.url+')';
        } catch (e) {
          return null;
        }
      }

      function localizedAsset(asset, locale) {
        var defaultLocale = scope.spaceContext.defaultLocale;
        var file  = asset.data.fields.file;
        var title = asset.data.fields.title;
        return {
          file:   file[locale.code] ||  file[defaultLocale.code] || _.first(file ),
          title: title[locale.code] || title[defaultLocale.code] || _.first(title),
        };
      }

      // Update Preview /////////////////////////////////////

      scope.$watch('displayMode', function () {
        var source = scope.fieldData.value;
        if (scope.inPreviewMode() && source) {
          scope.markdownPreview = marked(source);
        } else {
          scope.markdownPreview = null;
        }
      });

      scope.$watch('fieldData.value', function (source, old, scope) {
        if (scope.inPreviewMode() && source) {
          scope.markdownPreview = marked(source);
        } else {
          scope.markdownPreview = null;
        }
      });
    }
  };
}]);
