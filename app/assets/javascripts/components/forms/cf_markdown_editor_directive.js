'use strict';
angular.module('contentful').directive('cfMarkdownEditor', function(marked, keycodes, $document, $window, $timeout){
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
        if (scope.inPreviewMode()) {
          scope.displayMode = 'edit';
        } else {
          scope.displayMode = 'preview';
        }
      };

      scope.enterEditor = function () {
        /*
        if (scope.displayMode === 'preview') {
          scope.displayMode = 'edit';
          textarea.trigger('autosize');
          _.delay(function () {
            //textarea.textrange('set', 0);
            textarea.trigger('focus');
          }, 200);
        }
       */
      };

      textarea.on('focus', function () {
        toolbar.addClass('opaque');
        modeSwitch.addClass('opaque');
      });

      textarea.on('blur', function () {
        toolbar.removeClass('opaque');
        modeSwitch.removeClass('opaque');
      });

      function isPreviewKey(ev) {
        return ev.metaKey && ev.shiftKey && ev.keyCode === keycodes.p;
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
        textarea.trigger('input').trigger('autosize');
      }

      scope.toggleBold = function () { toggleWrapper('**', '\\*\\*'); };
      scope.toggleItalic = function () { toggleWrapper('*', '\\*'); };

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
        textarea.trigger('input').trigger('autosize');
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
        textarea.trigger('input').trigger('autosize');
        textarea.textrange('setcursor', afterPosition);
      };

      scope.insertRule = function () {
        var range = lineRange();
        textarea.textrange('replace', range.text + '\n\n___');
        textarea.textrange('set', range.end, 0);
        textarea.trigger('input').trigger('autosize');
      };

      scope.toggleBlockQuote = function () {
        var range = lineRange();
        var quote = range.text.split('\n').map(function (line) {
          return '> '+line;
        }).join('\n');
        textarea.textrange('replace', quote);
        textarea.trigger('input').trigger('autosize');
        textarea.textrange('setcursor', range.end + 1);
      };

      scope.addCodeblock = function () {
        var range = lineRange();
        textarea.textrange('replace', '```\n' + range.text + '\n```');
        textarea.trigger('input').trigger('autosize');
        textarea.textrange('setcursor', range.start + 4);
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

      // Update Preview /////////////////////////////////////

      scope.$watch('fieldData.value', function (source, old, scope) {
        if (source) {
          scope.markdownPreview = marked(source);
        } else {
          scope.markdownPreview = null;
        }
      });
    }
  };
});
