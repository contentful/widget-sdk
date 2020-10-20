import { get } from 'lodash';
import * as Analytics from 'analytics/Analytics';
import { getWebhookRepo } from './services/WebhookRepoInstance';

const INVALID_BODY_TRANSFORMATION_ERROR_MSG =
  'Please make sure your custom payload is a valid JSON.';
const HTTP_BASIC_ERROR_MSG = 'Please provide a valid username/password combination.';
const CONFLICT_ERROR_MSG =
  'Can only save the most recent version. Please refresh the page and try again.';
const UNKNOWN_ERROR_MSG = 'An error occurred while saving your webhook. Please try again.';

const PATH_TO_ERROR_MSG = {
  name: 'Please provide a valid webhook name.',
  url: 'Please provide a valid webhook URL.',
  topics: 'Please select at least one triggering event type.',
  filters: 'Please make sure all filters are valid or remove incomplete ones.',
  headers: 'Please make sure all headers are valid or remove incomplete ones.',
  http_basic_username: HTTP_BASIC_ERROR_MSG,
  http_basic_password: HTTP_BASIC_ERROR_MSG,
};

export async function save(webhook, spaceId, space, templateId, templateIdReferrer) {
  const webhookRepo = getWebhookRepo({ spaceId, space });

  if (!webhookRepo.hasValidBodyTransformation(webhook)) {
    throw new Error(INVALID_BODY_TRANSFORMATION_ERROR_MSG);
  }

  try {
    const saved = await webhookRepo.save(webhook);
    trackSave(saved, templateId, templateIdReferrer);
    return saved;
  } catch (err) {
    throw new Error(getSaveApiErrorMessage(err));
  }
}

function getSaveApiErrorMessage(err) {
  if (get(err, ['body', 'sys', 'id']) === 'Conflict') {
    return CONFLICT_ERROR_MSG;
  } else {
    const [apiError] = get(err, ['body', 'details', 'errors'], []);
    const message = apiError && PATH_TO_ERROR_MSG[apiError.path];
    return message || UNKNOWN_ERROR_MSG;
  }
}

export function remove(webhook, spaceId, space) {
  return getWebhookRepo({ spaceId, space }).remove(webhook);
}

function trackSave(webhook, templateId = null, templateIdReferrer = null) {
  const trackingData = {
    template_id: templateId,
    type: templateIdReferrer,
    webhook_id: get(webhook, ['sys', 'id']),
    version: get(webhook, ['sys', 'version']),
    method: get(webhook, ['transformation', 'method'], 'POST'),
    url: get(webhook, ['url']),
    webhook_name: get(webhook, ['name']),
    custom_headers: get(webhook, ['headers'], []).map(({ key }) => key),
    uses_http_basic: !!get(webhook, ['httpBasicUsername']),
    content_type_header: get(webhook, ['transformation', 'contentType']),
    topics: get(webhook, ['topics']),
    filters: JSON.stringify(get(webhook, ['filters'])),
    body_transformation: get(webhook, ['transformation', 'body']),
  };

  Analytics.track('ui_webhook_editor:save', trackingData);
}
