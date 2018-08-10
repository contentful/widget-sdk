import {get} from 'lodash';
import notification from 'notification';
import modalDialog from 'modalDialog';
import ReloadNotification from 'ReloadNotification';

const INVALID_BODY_TRANSFORMATION_ERROR_MSG = 'Please make sure your custom payload is a valid JSON.';
const HTTP_BASIC_ERROR_MSG = 'Please provide a valid username/password combination.';
const CONFLICT_ERROR_MSG = 'Can only save the most recent version. Please refresh the page and try again.';
const UNKNOWN_ERROR_MSG = 'An error occurred while saving your webhook. Please try again.';

const PATH_TO_ERROR_MSG = {
  name: 'Please provide a valid webhook name.',
  url: 'Please provide a valid webhook URL.',
  topics: 'Please select at least one triggering event type.',
  filters: 'Please make sure all filters are valid or remove incomplete ones.',
  headers: 'Please make sure all headers are valid or remove incomplete ones.',
  http_basic_username: HTTP_BASIC_ERROR_MSG,
  http_basic_password: HTTP_BASIC_ERROR_MSG
};

export async function save (webhookRepo, webhook) {
  if (!webhookRepo.hasValidBodyTransformation(webhook)) {
    notification.error(INVALID_BODY_TRANSFORMATION_ERROR_MSG);
    throw new Error(INVALID_BODY_TRANSFORMATION_ERROR_MSG);
  }

  try {
    const saved = await webhookRepo.save(webhook);
    notification.info(`Webhook "${saved.name}" saved successfully.`);
    return saved;
  } catch (err) {
    handleSaveApiError(err);
    throw err;
  }
}

function handleSaveApiError (err) {
  if (get(err, ['body', 'sys', 'id']) === 'Conflict') {
    notification.error(CONFLICT_ERROR_MSG);
  } else {
    const [apiError] = get(err, ['body', 'details', 'errors'], []);
    const message = apiError && PATH_TO_ERROR_MSG[apiError.path];
    notification.error(message || UNKNOWN_ERROR_MSG);
  }
}

export async function remove (webhookRepo, webhook) {
  try {
    await openRemovalDialog(webhookRepo, webhook);
    notification.info(`Webhook "${webhook.name}" deleted successfully.`);
    return {removed: true};
  } catch (err) {
    if (err instanceof Error) {
      ReloadNotification.basicErrorHandler();
      throw err;
    } else {
      return {cancelled: true};
    }
  }
}

function openRemovalDialog (webhookRepo, webhook) {
  return modalDialog.open({
    ignoreEsc: true,
    backgroundClose: false,
    template: '<react-component class="modal-background" name="app/Webhooks/WebhookRemovalDialog" props="props" />',
    controller: $scope => {
      $scope.props = {
        webhookUrl: webhook.url,
        remove: () => webhookRepo.remove(webhook),
        // `modalScope.dialog` is not available right away
        // so we pass wrapped invocations to the component.
        confirm: () => $scope.dialog.confirm(),
        cancel: err => $scope.dialog.cancel(err)
      };
    }
  }).promise;
}
