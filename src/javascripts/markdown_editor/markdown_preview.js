'use strict';

angular.module('contentful').factory('MarkdownEditor/preview', ['$injector', function ($injector) {

  var $timeout       = $injector.get('$timeout');
  var $sanitize      = $injector.get('$sanitize');
  var LazyLoader     = $injector.get('LazyLoader');
  var createRenderer = $injector.get('MarkdownEditor/createMarkdownRenderer');

  var NOTIFY_INTERVAL = 250;
  var EMBEDLY_CLASS_RE = new RegExp('class="embedly-card"', 'g');

  return function startLivePreview(editor, subscriberCb) {
    var destroyed = false;
    var previousValue = null;
    var renderMarkdown;

    LazyLoader.get('markdown').then(function (libs) {
      renderMarkdown = createRenderer(libs.marked);
      scheduleSubscriberNotification();
    });

    return function () { destroyed = true; };

    /**
     * Notification logic
     */

    function scheduleSubscriberNotification() {
      $timeout(notifySubscriber, NOTIFY_INTERVAL);
    }

    function notifySubscriber() {
      // editor was destroyed - kill loop immediately
      if (destroyed) { return; }

      // check if something changed
      var value = editor.getContent();
      if (value === previousValue) {
        scheduleSubscriberNotification();
        return;
      } else {
        previousValue = value;
      }

      // render HTML from Markdown and calculate stats
      var html, info;
      var err = null;
      try {
        html = renderAndSanitizeMarkdown(value);
        info = { chars: value.length || 0, words: countWords(html) };
      } catch (e) {
        // it can go wrong: both Marked and ngSanitize throw errors
        // it happens when for e.g. user is in the middle of typing HTML tag
        err = e;
      }

      // notify subscriber
      subscriberCb(err, html, info);
      // repeat
      scheduleSubscriberNotification();
    }

    function renderAndSanitizeMarkdown(markup) {
      var html = renderMarkdown(markup);
      html = html.replace(/\r?\n|\r/g, '');
      html = $sanitize(html);
      html = disableEmbedlyControls(html);

      return html;
    }

    function disableEmbedlyControls(html) {
      return html.replace(EMBEDLY_CLASS_RE, 'class="embedly-card" data-card-controls="0"');
    }

    function countWords(html) {
      var clean = html.replace(/<\/?[^>]+(>|$)/g, '');
      var words = (clean || '').replace(/\s+/g, ' ').split(' ');
      words = _.filter(words, function (word) { return word.length > 0; });

      return words.length || 0;
    }
  };
}]);

angular.module('contentful').directive('cfMarkdownPreview', function () {
  return {
    restrict: 'E',
    scope: { preview: '=' },
    template: [
      '<div ng-bind-html="preview.html" ng-if="!preview.hasCrashed"></div>',
      '<div ng-if="preview.hasCrashed">',
        '<i class="fa fa-warning"></i> ',
        'We cannot render the preview. ',
        'If you use HTML tags, check if these are valid.',
      '</div>'
    ].join('')
  };
});
