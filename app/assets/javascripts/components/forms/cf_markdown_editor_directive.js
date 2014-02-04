'use strict';
angular.module('contentful').directive('cfMarkdownEditor', function(marked, $sce, $timeout){
  return {
    restrict: 'C',
    template: JST['cf_markdown_editor'](),
    link: function(scope, elem, attr){
      var textarea = elem.find('textarea');

      // Different display modes: preview, edit, combined
      scope.displayMode = 'preview';

      scope.guideOpen = true;
      scope.toggleGuide = function () {
        scope.guideOpen = !scope.guideOpen;
      };

      scope.toggleDisplayMode = function () {
        if (scope.displayMode == 'preview') {
          scope.displayMode = 'edit';
        } else {
          scope.displayMode = 'preview';
        }
      };

      scope.enterEditor = function () {
        if (scope.displayMode === 'preview') {
          scope.displayMode = 'edit';
          textarea.trigger('autosize');
          _.delay(function () {
            //textarea.textrange('set', 0);
            textarea.trigger('focus');
          }, 200);
        }
      };

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

        if (match) {
          var currentLevel = match[0].length - 1;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.substr(currentLevel + 1);
          }));
        } else {
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return '########'.substr(0, level) + ' ' + line;
          }));
        }
      };

      scope.toggleUnorderedList = function () {
        var prefix = /^-+ /;
        var range = lineRange();
        var match = range.text.match(prefix);

        if (match) {
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.replace(prefix, '');
          }));
        } else {
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return '- ' + line;
          }));
        }
        textarea.trigger('input').trigger('autosize');
      };

      scope.toggleOrderedList = function () {
        var numPrefix = /^(\d+)\. /;
        var range = lineRange();
        var match = range.text.match(numPrefix);

        if (match) {
          textarea.textrange('replace', mapLines(range.text, function (line) {
            return line.replace(numPrefix, '');
          }));
        } else {
          var lineNum = 0;
          textarea.textrange('replace', mapLines(range.text, function (line) {
            lineNum++;
            return '' + lineNum + '. ' + line;
          }));
        }
        textarea.trigger('input').trigger('autosize');
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
      };

      scope.addCodeblock = function () {
        var range = lineRange();
        textarea.textrange('replace', '```\n' + range.text + '\n```');
        textarea.trigger('input').trigger('autosize');
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
