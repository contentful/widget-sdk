import * as K from 'core/utils/kefir';
import { caseof } from 'sum-types';
import ReloadNotification from 'app/common/ReloadNotification';
import { Error } from 'data/document/Error';

const getForbidden = (docError$) =>
  docError$.filter((error) => {
    return caseof(error, [
      [[Error.OpenForbidden, Error.SetValueForbidden], () => true],
      [null, () => false],
    ]);
  });

const onValue = ({ error }) => {
  if (error instanceof Error.CmaInternalServerError) {
    ReloadNotification.trigger('Due to a server error, we could not process this document');
  } else {
    ReloadNotification.trigger(
      'Due to an authentication error, we could not process this editing ' +
        'operation. Please reload the application and try again',
      'Editing denied'
    );
  }
};

export function initDocErrorHandler(docError$) {
  const forbidden = getForbidden(docError$);
  K.onValue(forbidden.take(1), onValue);
}
