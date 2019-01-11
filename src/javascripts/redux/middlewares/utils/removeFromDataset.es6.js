import { ModalConfirm, Notification } from '@contentful/forma-36-react-components';
import React from 'react';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getDatasets } from 'redux/selectors/datasets.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

export default async function(
  { dispatch, getState },
  next,
  action,
  createService,
  sendRemoveRequest,
  id,
  dataset,
  confirmationTitle,
  confirmationText,
  successMessage,
  errorMessage
) {
  const state = getState();
  const service = createService(getOrgId(state));
  const datasets = getDatasets(state);
  const item = datasets[dataset][id];
  // call reducer in case it optimistically removes
  next(action);
  const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      title={confirmationTitle(item)}
      intent="negative"
      isShown={isShown}
      confirmLabel="Remove"
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}>
      <p>{confirmationText(item)}</p>
    </ModalConfirm>
  ));

  if (!confirmation) {
    return;
  }

  const type = 'REMOVE_FROM_DATASET';
  try {
    dispatch({ type, payload: { id, dataset }, meta: { pending: true } });
    await sendRemoveRequest(service, item);
    dispatch({ type, payload: { id, dataset } });
    Notification.success(successMessage(item));
  } catch (e) {
    dispatch({ type, payload: e, error: true, meta: { item, dataset } });
    Notification.error(errorMessage(item));
  }
}
