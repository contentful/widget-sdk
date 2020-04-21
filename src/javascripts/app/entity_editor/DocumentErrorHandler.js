import * as K from 'core/utils/kefir';
import { caseof } from 'sum-types';
import ReloadNotification from 'app/common/ReloadNotification';
import { Error } from 'data/document/Error';

export default function init($scope, docError$) {
  const forbidden = docError$.filter((error) => {
    return caseof(error, [
      [[Error.OpenForbidden, Error.SetValueForbidden], () => true],
      [null, () => false],
    ]);
  });
  K.onValueScope($scope, forbidden.take(1), ({ error }) => {
    if (
      error instanceof Error.ShareJsInternalServerError ||
      error instanceof Error.CmaInternalServerError
    ) {
      ReloadNotification.trigger('Due to a server error, we could not process this document');
    } else {
      ReloadNotification.trigger(
        'Due to an authentication error, we could not process this editing ' +
          'operation. Please reload the application and try again',
        'Editing denied'
      );
    }
  });
}
