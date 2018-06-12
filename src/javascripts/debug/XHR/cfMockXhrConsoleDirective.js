angular.module('contentful')

.directive('cfMockXhrConsole', ['require', require => {
  var h = require('utils/hyperscript').h;

  return {
    template: getTemplate(),
    link: function (scope) {
      var mxhr = scope.xhrMock;

      scope.rules = [];
      scope.enabled = true;

      scope.add = add;
      scope.remove = remove;
      scope.toggle = toggle;

      function add (urlPattern, status) {
        var rule = { urlPattern: RegExp(urlPattern), status: status };
        mxhr.addRule(rule);
        scope.rules.push(rule);
      }

      function remove (ix) {
        mxhr.removeRule(ix);
        scope.rules.splice(ix, 1);
      }

      function toggle () {
        scope.enabled ? mxhr.restore() : mxhr.enable();
        scope.enabled = !scope.enabled;
      }
    }
  };

  function getTemplate () {
    var style = {
      wrapper: {
        position: 'fixed',
        width: '400px',
        border: '2px solid #000',
        right: '20px',
        bottom: '20px',
        background: '#fff'
      },
      content: {
        height: '250px',
        overflowY: 'scroll',
        padding: '15px'
      }
    };

    var closeBtn = h('button', {ngClick: 'isVisible = false'}, ['close']);

    var collapseBtn = h('button', {ngClick: 'isCollapsed = !isCollapsed'}, ['{{isCollapsed ? "expand" : "collapse"}}']);

    var rulesTable = h('table', {}, [
      h('tr', {}, [
        h('th', {}, ['Url match (RegExp)']),
        h('th', {}, ['Response status'])
      ]),
      h('tr', {ngRepeat: 'rule in rules'}, [
        h('td', {}, ['{{rule.urlPattern.toString()}}']),
        h('td', {}, ['{{rule.status}}']),
        h('td', {}, [h('button', {ngClick: 'remove($index)'}, ['x'])])
      ]),
      h('tr', {}, [
        h('td', {}, [h('input', {ngModel: 'urlPattern', ngInit: 'urlPattern="content_types"'})]),
        h('td', {}, [h('input', {ngModel: 'status', ngInit: 'status="502"'})]),
        h('td', {}, [h('button', {ngClick: 'add(urlPattern, status)'}, ['Add'])])
      ])
    ]);

    var disableButton = h('button', {
      ngClick: 'toggle()',
      ngDisabled: 'rules.length === 0'
    }, ['{{ enabled ? "Disable" : "Enable" }}']);

    var noRulesMsg = h('p', {ngIf: 'rules.length === 0'}, ['Add some rules and click \'enable\'']);

    return h('.xhr-console', {
      style: style.wrapper,
      ngShow: 'isVisible'
    }, [
      closeBtn,
      collapseBtn,
      h('.xhr-console__content', {
        style: style.content,
        ngShow: '!isCollapsed'
      }, [
        rulesTable,
        disableButton,
        h('br'),
        h('br'),
        noRulesMsg
      ])
    ]);
  }
}]);
