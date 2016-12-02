angular.module('contentful')
.directive('cfSpaceSettings', ['require', function (require) {
  var h = require('utils/hyperscript').h;

  var template = h([
    h('header.workbench-header', [
      h('cf-icon.workbench-header__icon',
        {name: 'page-settings'}
      ),
      h('h1.workbench-header__title', 'Space settings'),
      h('.workbench-header__actions', [
        h('button.btn-caution',
          {'ui-command': 'openRemovalDialog'},
          'Remove space and all its contents'
        ),
        h('button.btn-primary-action',
          {'ui-command': 'save'}, 'Save'
        )
      ])
    ]),
    h('.workbench-main.x--content',
      h('.workbench-main__middle-content', [
        h('.cfnext-form__field', [
          h('label', {for: 'space-id'}, 'Space ID:'),
          h('input#space-id.cfnext-form__input--full-size',
            {
              type: 'text',
              value: '{{spaceId}}',
              readonly: 'readonly',
              'cf-select-all-input': true
            })
        ]),
        h('.cfnext-form__field', [
          h('label', {for: 'space-name'}, 'Space name:'),
          h('input#space-name.cfnext-form__input--full-size',
            {type: 'text', 'ng-model': 'model.name'})
        ])
      ])
    )
  ]);

  return {
    template: template,
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}]);
