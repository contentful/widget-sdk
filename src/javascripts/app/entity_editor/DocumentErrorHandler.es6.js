import * as K from 'utils/kefir';
import { caseof } from 'sum-types';

import { trigger as showReloadModal } from 'ReloadNotification';
import { Error } from 'data/document/Error';

export default function init($scope, docError$) {
  const forbidden = docError$.filter(error => {
    return caseof(error, [
      [[Error.OpenForbidden, Error.SetValueForbidden], () => true],
      [null, () => false]
    ]);
  });
  K.onValueScope($scope, forbidden.take(1), () => {
    showReloadModal(
      'Due to an authentication error, we could not process this editing ' +
        'operation. Please reload the application and try again',
      'Editing denied'
    );
  });
}
