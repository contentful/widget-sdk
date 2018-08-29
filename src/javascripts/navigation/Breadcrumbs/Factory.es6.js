import { constant as constantly, extend } from 'lodash';
import { deepFreeze } from 'utils/Freeze';

/**
 * @ngdoc service
 * @name navigation/Breadcrumbs/Factory
 * @description
 * Exports breadcrumb object factories.
 *
 * `context` parameter is a reference to an object
 * {dirty: bool, title: string} that is manipulated
 * by a view controller. It's used to compute a title
 * of a breadcrumb.
 */

export const Entry = EntryOrAsset;
export const Asset = EntryOrAsset;

function EntryOrAsset(sys, context) {
  const segment = sys.type === 'Asset' ? 'assets' : 'entries';
  const idParamName = sys.type === 'Asset' ? 'assetId' : 'entryId';

  return base(sys.type, sys.id, {
    getTitle: titleFromContext(context),
    link: entityLink(segment, idParamName, sys.id),
    icon: sys.type === 'Asset' ? 'asset' : 'entry'
  });
}

export function ContentTypeList() {
  return base('ContentTypeList', {
    getTitle: constantly('Content model'),
    link: link('content_types.list'),
    icon: 'model'
  });
}

export function ContentType(id, context) {
  return base('ContentType', id, {
    getTitle: titleFromContext(context),
    link: entityLink('content_types', 'contentTypeId', id),
    icon: 'model'
  });
}

export function EntryList() {
  return base('EntryList', {
    getTitle: constantly('Content'),
    link: link('entries.list'),
    icon: 'entries'
  });
}

export function EntrySnapshot(id, context) {
  return base('EntrySnapshotComparison', {
    getTitle: titleFromContext(context),
    link: link('entries.compare.withCurrent', { snapshotId: id }),
    icon: 'entry'
  });
}

export function AssetList() {
  return base('AssetList', {
    getTitle: constantly('Media'),
    link: link('assets.list'),
    icon: 'assets'
  });
}

export function CMAKeyList() {
  return base('CMAKeyList', {
    getTitle: constantly('Content Management API Keys'),
    link: link('api.cma_keys')
  });
}

export function CDAKeyList() {
  return base('CDAKeyList', {
    getTitle: constantly('Content Delivery API Keys'),
    link: link('api.keys.list')
  });
}

export function CDAKey(id, context) {
  return base('CDAKey', id, {
    getTitle: titleFromContext(context),
    link: entityLink('api.keys', 'apiKeyId', id)
  });
}

export function LocaleList() {
  return base('LocaleList', {
    getTitle: constantly('Locales'),
    link: link('settings.locales.list')
  });
}

export function Locale(id, context) {
  return base('Locale', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.locales', 'localeId', id)
  });
}

export function RoleList() {
  return base('RoleList', {
    getTitle: constantly('Roles'),
    link: link('settings.roles.list')
  });
}

export function Role(id, context) {
  return base('Role', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.roles', 'roleId', id)
  });
}

export function PreviewEnvList() {
  return base('PreviewEnvList', {
    getTitle: constantly('Content Preview'),
    link: link('settings.content_preview.list')
  });
}

export function PreviewEnv(id, context) {
  return base('PreviewEnv', id, {
    getTitle: titleFromContext(context),
    link: entityLink('settings.content_preview', 'contentPreviewId', id)
  });
}

/**
 * @ngdoc type
 * @name Breadcrumb
 * @method {function} getTitle
 *   should return the current title
 * @property {object} link
 *   link object: {state: string, params: object}
 * @property {string} type
 *   breadcrumb type (each view has a unique type)
 * @property {string} id
 *   unique ID of a view instance (may contain entity)
 * @property {string} icon
 *   icon name to be used (w/o "breadcrumbs-icon-" prefix)
 */

/**
 * @returns {Breadcrumb}
 */
function base(type, id, crumb) {
  if (arguments.length === 2) {
    crumb = id;
    id = undefined;
  }

  if (id) {
    id = ['__entity_view', type, id].join(',');
  } else {
    id = ['__view', type].join(',');
  }

  crumb.icon = crumb.icon || 'settings';

  return deepFreeze(extend({ type, id }, crumb));
}

function titleFromContext(context) {
  context = context || { title: 'Untitled' };
  return function getTitle() {
    return context.title + (context.dirty ? '*' : '');
  };
}

function entityLink(state, idParamName, id) {
  const params = {};
  if (id) {
    params[idParamName] = id;
  }

  return link([state, id ? 'detail' : 'new'].join('.'), params);
}

function link(state, params) {
  return {
    state: 'spaces.detail.' + state,
    params
  };
}
