'use strict';

angular.module('contentful').factory('MarkdownEditor/preview', ['$injector', function ($injector) {

  var $timeout          = $injector.get('$timeout');
  var LazyLoader        = $injector.get('LazyLoader');
  var createTreeBuilder = $injector.get('MarkdownEditor/tree');

  var NOTIFY_INTERVAL  = 250;
  var UNIQUE_SOMETHING = {};

  return function startLivePreview(getContentFn, subscriberCb) {
    var destroyed     = false;
    var previousValue = UNIQUE_SOMETHING;
    var buildTree;

    LazyLoader.get('markdown').then(function (libs) {
      buildTree = createTreeBuilder(libs);
      scheduleSubscriberNotification();
    });

    return function stopNotification() { destroyed = true; };

    function scheduleSubscriberNotification() {
      $timeout(notifySubscriber, NOTIFY_INTERVAL);
    }

    function notifySubscriber() {
      // editor was destroyed - kill loop immediately
      if (destroyed) { return; }

      // check if something changed
      var value = getContentFn();
      if (value === previousValue) {
        scheduleSubscriberNotification();
        return;
      }

      value = value || '';
      previousValue = value;

      // build tree
      var tree = {};
      var err = null;
      try {
        tree = buildTree(value);
      } catch (e) {
        // it can go wrong: both Marked and ngSanitize throw errors
        // it happens when for e.g. user is in the middle of typing HTML tag
        err = e;
      }

      // notify subscriber
      var info = { chars: value.length, words: tree.words };
      subscriberCb(err, { tree: tree.root, info: info });

      // repeat
      scheduleSubscriberNotification();
    }
  };
}]);

angular.module('contentful').directive('cfMarkdownPreview', ['$injector', function ($injector) {

  var LazyLoader = $injector.get('LazyLoader');

  return {
    restrict: 'E',
    scope: {
      preview: '=',
      isDisabled: '='
    },
    template: [
      '<div ng-show="!preview.hasCrashed" class="markdown-preview-mounting-point"></div>',
      '<div ng-show="preview.hasCrashed || mountHasCrashed" class="markdown-preview-crashed">',
        '<i class="fa fa-warning"></i> ',
        'We cannot render the preview. ',
        'If you use HTML tags, check if these are valid.',
      '</div>'
    ].join(''),
    link: function (scope, el) {
      var mountingPoint = el.find('.markdown-preview-mounting-point').get(0);
      scope.mountHasCrashed = false;
      LazyLoader.get('markdown').then(initPreview);

      function initPreview(libs) {
        var React = libs.React;

        scope.$watch('preview.tree', update);
        scope.$watch('isDisabled',   update);

        scope.$on('$destroy', unmount);

        function update() {
          var newTree = scope.preview && scope.preview.tree;
          if (!newTree || scope.isDisabled) { return; }

          try {
            mount();
            scope.mountHasCrashed = false;
          } catch (e) {
            scope.mountHasCrashed = true;
          }
        }

        function mount()   { React.render(scope.preview.tree, mountingPoint); }
        function unmount() { React.unmountComponentAtNode(mountingPoint);     }
      }
    }
  };
}]);
