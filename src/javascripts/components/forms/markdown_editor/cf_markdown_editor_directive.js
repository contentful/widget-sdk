'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function($injector){
  var $document   = $injector.get('$document');
  var $rootScope  = $injector.get('$rootScope');
  var $timeout    = $injector.get('$timeout');
  var $window     = $injector.get('$window');
  var assetUrl    = $injector.get('$filter')('assetUrl');
  var delay       = $injector.get('delay');
  var keycodes    = $injector.get('keycodes');
  var modalDialog = $injector.get('modalDialog');
  var marked      = $injector.get('marked');

  var renderer = new marked.Renderer();

  renderer._image = renderer.image;
  renderer.image = function (href, title, text) {
    href = ''+href+'?h=200';
    var img = this._image(href, title, text);
    return '<div class="markdown-image-placeholder">'+img+'</div>';
  };

  return {
    restrict: 'A',
    template: JST['cf_markdown_editor'](),
    link: function(scope, elem){
      var textarea = elem.find('textarea');
      var toolbar = elem.find('.markdown-toolbar');
      var modeSwitch = elem.find('.markdown-modeswitch');
      var preview = elem.find('.markdown-preview');
      var validations = dotty.get(scope, 'widget.field.validations', []);

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
          $rootScope.$broadcast('elastic:adjust');
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
        var range = lineRange();
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
        insertText('\n\n___');
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
          template: 'insert_asset_dialog',
          ignoreEnter: true
        }).promise.then(function (assets) {
          if (_.isEmpty(assets)) return;
          var links = _.map(assets, makeAssetLink).join('\n');
          insertText('\n\n'+links+'\n');
        });
      };

      scope.insertExternalLink = function() {
        modalDialog.open({
          scope: $rootScope.$new(),
          template: 'insert_external_link_dialog',
          ignoreEnter: true
        }).promise.then(function(link) {
          var markup = makeExternalLink(link);
          insertText(markup);
        });
      };

      // Helpers ///////////////////////////////////////////

      function lineRange() {
        var range = textarea.textrange('get');
        var lines = entireLines(range);
        textarea.textrange('set', lines.start, lines.length);
        return textarea.textrange('get');
      }

      function insertText(text) {
        var range = lineRange();
        textarea.textrange('replace', range.text + text);
        textarea.textrange('set', range.end, 0);
        triggerUpdateEvents();
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

      function triggerUpdateEvents() {
        $rootScope.$broadcast('elastic:adjust');
        var textareaElem = textarea.get(0);
        /*global Event*/
        // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
        var evt;
        try {
          evt = new Event('paste');
        } catch(e) {
          evt = document.createEvent('Event');
          evt.initEvent('paste', true, true);
        }
        textareaElem.dispatchEvent(evt);
      }

      function makeAssetLink(asset) {
        try {
          asset = localizedAsset(asset, scope.locale);
          return '!['+asset.title+']('+assetUrl(asset.file.url)+')';
        } catch (e) {
          return null;
        }
      }

      function makeExternalLink(link) {
        var url = encodeURI(link.url);
        if (link.title) {
          return '[' + link.title + '](' + url + ')';
        }
        return '<' + url + '>';
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

      // Update preview and counts /////////////////////////////////////

      scope.$watch('displayMode', function() {
        updatePreview();
        updateCounts();
      });

      var timeoutPromise = tick();
      function tick() {
        updatePreview();
        updateCounts();
        timeoutPromise = $timeout(tick, 500);
        return timeoutPromise;
      }

      scope.$on('$destroy', function() {
        $timeout.cancel(timeoutPromise);
      });

      function updatePreview() {
        scope.markdownPreview = marked(getFieldRawValue(), {renderer: renderer});
      }

      function updateCounts() {
        scope.counts = {
          rawChars: getFieldRawValue().length,
          textWords: countWords(getFieldTextValue()),
          constraints: _(validations).pluck('size').first()
        };
      }

      function getFieldRawValue() {
        return dotty.get(scope, 'fieldData.value', '') || '';
      }

      function getFieldTextValue() {
        return htmlToText(scope.markdownPreview || '');
      }

      function countWords(v) {
        var words = v.replace(/\s+/gm, ' ').split(' ');
        words = words.filter(function(word) { return word.length > 0; });
        return words.length;
      }

      function htmlToText(v) {
        return v.replace(/<[^>]+>/gm, '');
      }
    }
  };
}]);
