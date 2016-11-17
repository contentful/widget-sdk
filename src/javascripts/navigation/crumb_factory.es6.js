import {constant as constantly, extend} from 'lodash';

/**
 * @ngdoc service
 * @name navigation/crumb_factory
 * @description
 * Exports breadcrumb object factories.
 */

export const Entry = EntryOrAsset;
export const Asset = EntryOrAsset;

function EntryOrAsset (entity, context) {
  const segment = entity.getType() === 'Asset' ? 'assets' : 'entries';
  const idParamName = entity.getType() === 'Asset' ? 'assetId' : 'entryId';

  return base(entity.getType(), entity.getId(), {
    getTitle: titleFromContext(context),
    link: entityLink(segment, idParamName, entity.getId())
  });
}

export function ContentTypeList () {
  return base('ContentTypeList', {
    getTitle: constantly('Content model'),
    link: link('content_types.list')
  });
}

export function ContentType (id, context) {
  return base('ContentType', id, {
    getTitle: titleFromContext(context),
    link: entityLink('content_types', 'contentTypeId', id)
  });
}

export function EntryList () {
  return base('EntryList', {
    getTitle: constantly('Content'),
    link: link('entries.list')
  });
}

export function EntrySnapshot (id, context) {
  return base('EntrySnapshotComparison', {
    getTitle: titleFromContext(context),
    link: link('entries.compare.withCurrent', {snapshotId: id})
  });
}

export function AssetList () {
  return base('AssetList', {
    getTitle: constantly('Media'),
    link: link('assets.list')
  });
}

export function CMAKeyList () {
  return base('CMAKeyList', {
    getTitle: constantly('Content Management API Keys'),
    link: link('api.cma_keys')
  });
}

export function CDAKeyList () {
  return base('CDAKeyList', {
    getTitle: constantly('Content Delivery API Keys'),
    link: link('api.keys.list')
  });
}

export function CDAKey (id, context) {
  return base('CDAKey', id, {
    getTitle: titleFromContext(context),
    link: entityLink('api.keys', 'apiKeyId', id)
  });
}

export function LocaleList () {
  return base('LocaleList', {
    getTitle: constantly('Locales'),
    link: link('settings.locales.list')
  });
}

export function Locale (id, context) {
  return base('Locale', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.locales', 'localeId', id)
  });
}

export function RoleList () {
  return base('RoleList', {
    getTitle: constantly('Roles'),
    link: link('settings.roles.list')
  });
}

export function Role (id, context) {
  return base('Role', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.roles', 'roleId', id)
  });
}

export function WebhookList () {
  return base('WebhookList', {
    getTitle: constantly('Webhooks'),
    link: link('settings.webhooks.list')
  });
}

export function Webhook (id, context) {
  return base('Webhook', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.webhooks', 'webhookId', id)
  });
}

export function WebhookCall (call) {
  return base('WebhookCall', call.sys.id, {
    getTitle: constantly('Call details (' + call.requestAt + ')'),
    link: link('settings.webhooks.detail.call', {callId: call.sys.id})
  });
}

export function PreviewEnvList () {
  return base('PreviewEnvList', {
    getTitle: constantly('Content Preview'),
    link: link('settings.content_preview.list')
  });
}

export function PreviewEnv (id, context) {
  return base('PreviewEnv', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.content_preview', 'contentPreviewId', id)
  });
}

/**
 * Helpers
 */

function base (type, id, crumb) {
  if (arguments.length === 2) {
    crumb = id;
    id = undefined;
  }

  id = id || ('__internal,no-id' + type);

  return extend({type, id}, crumb);
}

function titleFromContext (context) {
  context = context || {title: 'Untitled'};
  return function getTitle () {
    return context.title + (context.dirty ? '*' : '');
  };
}

function entityLink (state, idParamName, id) {
  const params = {};
  if (id) {
    params[idParamName] = id;
  }

  return link([state, id ? 'detail' : 'new'].join('.'), params);
}

function link (state, params) {
  return {
    state: 'spaces.detail.' + state,
    params
  };
}
