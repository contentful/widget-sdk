import * as K from 'utils/kefir.es6';
import { caseof } from 'sum-types';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import { Error } from 'data/document/Error.es6';

export default function init($scope, docError$) {
  const forbidden = docError$.filter(error => {
    return caseof(error, [
      [[Error.OpenForbidden, Error.SetValueForbidden], () => true],
      [null, () => false]
    ]);
  });
  K.onValueScope($scope, forbidden.take(1), () => {
    ReloadNotification.trigger(
      'Due to an authentication error, we could not process this editing ' +
        'operation. Please reload the application and try again',
      'Editing denied'
    );
  });
}
