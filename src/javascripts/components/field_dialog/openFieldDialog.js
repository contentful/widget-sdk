import { getModule } from 'core/NgRegistry';
import fieldDialogTemplate from './field_dialog.html';
import { extend } from 'lodash';

export function openFieldDialog($scope, field, widget) {
  const modalDialog = getModule('modalDialog');
  const scope = extend($scope.$new(), {
    field: field,
    widget: widget,
  });
  return modalDialog.open({
    scope: scope,
    template: fieldDialogTemplate,
  }).promise;
}
