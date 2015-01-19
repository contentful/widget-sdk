'use strict';

angular.module('contentful').directive('cfCopyPaste', ['$injector', function($injector) {
  /*global ZeroClipboard*/
  var environment = $injector.get('environment');
  var $window = $injector.get('$window');
  ZeroClipboard.config({
    moviePath: '/app/ZeroClipboard.swf',
    forceHandCursor: true,
    allowScriptAccess: 'always',
    useNoCache: true,
    trustedOrigins: environment.settings.resourceUrlWhiteList
  });

  return {
    restrict: 'AC',
    link: function(scope, element, attrs) {
      scope.$evalAsync(function(){
        var clip = new ZeroClipboard(element.get(0));
        var copyText = {
          'default': 'Copy',
          'copying': 'Copying...',
          'copied': 'Copied'
        };
        element.attr('copy-status', 'default');

        element.tooltip(getOptions());

        function getOptions() {
          var options = {
            title: function () {
              return copyText[$(this).attr('copy-status')];
            }
          };
          var newKey;
          if(attrs.tooltipDelayShow){
            options.delay.show = attrs.tooltipDelayShow;
            delete attrs.tooltipDelayShow;
          }
          if(attrs.tooltipDelayHide){
            options.delay.hide = attrs.tooltipDelayHide;
            delete attrs.tooltipDelayHide;
          }
          _.forEach(attrs, function (val, key) {
            if(/^tooltip(.+)/.test(key)){
              newKey = key.replace('tooltip', '').toLowerCase();
              options[newKey] = val;
            }
          });
          return options;
        }


        function mouseoverHandler(/*client, args*/) {
          /*jshint validthis: true*/
          $(this).attr('copy-status', 'default');
          $(this).tooltip('show');
          setTimeout(_.bind(function () {
            $(this).tooltip('hide');
          }, this), 2000);

        }
        clip.on('mouseover', mouseoverHandler);

        function mouseoutHandler(/*client, args*/) {
          /*jshint validthis: true*/
          $(this).tooltip('hide');
          $(this).attr('copy-status', 'default');
        }
        clip.on('mouseout', mouseoutHandler);

        function dataRequestedHandler(client/*, args*/) {
          /*jshint validthis: true*/
          var clipboardTarget;
          $(this).tooltip('hide');
          $(this).attr('copy-status', 'copying');
          $(this).tooltip('show');
          var element = $(this);
          var siblingSelector = element.attr('clipboard-sibling-selector');
          var targetSelector = element.attr('clipboard-target-selector');
          if(siblingSelector)
            clipboardTarget = element.parent().find(siblingSelector);
          else if(targetSelector)
            clipboardTarget = $window.$(targetSelector);
          client.setText(clipboardTarget.val() || clipboardTarget.text());
        }
        clip.on('dataRequested', dataRequestedHandler);

        function completeHandler(/*client, args*/) {
          /*jshint validthis: true*/
          $(this).tooltip('hide');
          $(this).attr('copy-status', 'copied');
          $(this).tooltip('show');
          setTimeout(_.bind(function () {
            $(this).tooltip('hide');
            $(this).attr('copy-status', 'default');
          }, this), 2000);
        }
        clip.on('complete', completeHandler);


        element.on('$destroy', function () {
          clip.off('mouseover', mouseoverHandler);
          clip.off('mouseout', mouseoutHandler);
          clip.off('dataRequested', dataRequestedHandler);
          clip.off('complete', completeHandler);
          element.tooltip('destroy');
        });
      });
    }
  };
}]);
