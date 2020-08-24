import React from 'react';
import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import {
  getLabels,
  newConfigFromField,
  newConfigFromExtension,
  calculateIdealListHeight,
} from 'search/EntitySelector/Config';
import { getVariation, FLAGS } from 'LaunchDarkly';

import entitySelectorDialogTemplate from './entity_selector_dialog.html';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { EntitySelectorDialog } from './EntitySelectorDialog';

export const openByFlag = async (options) => {
  const spaceContext = getModule('spaceContext');

  const entitySelectorMigrationFeatureEnabled = await getVariation(
    FLAGS.ENTITY_SELECTOR_MIGRATION,
    {
      organizationId: spaceContext.getData('organization.sys.id'),
      environmentId: spaceContext.getEnvironmentId(),
      spaceId: spaceContext.getId(),
    }
  );

  if (entitySelectorMigrationFeatureEnabled) {
    return openEntitySelector(options);
  } else {
    return openLegacyEntitySelector(options);
  }
};

export function openEntitySelector(options) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <EntitySelectorDialog
      isShown={isShown}
      onClose={onClose}
      config={_.omit(options, 'scope', 'labels')}
      labels={_.extend(getLabels(options), options.labels)}
    />
  ));
}

/**
 * @param {Object} options
 * {
 *   locale: {String},
 *   multiple: {Boolean},
 *   max: {Number?}, // for multiple=true
 *   min: {Number?}, // for multiple=true
 *   entityType: {String},
 *   linkedContentTypeIds: {Array?},
 *   linkedMimetypeGroups: {Array?},
 *   fetch: {function(params): Promise<{items: {Array}, total: {Number}}>},
 *   labels: {
 *     title: {String},
 *     input: {String},
 *     info: {String?}, // for multiple=false
 *     infoHtml: {String?}, // for multiple=false, can be used instead of `.info`
 *     selected: {String}, // for multiple=true
 *     empty: {String},
 *     insert: {String},
 *     searchPlaceholder: {String}
 *   }
 * }
 * @returns {Promise<API.Entity[]>}
 * @description
 * Opens a modal for the provided custom config object
 */
export function openLegacyEntitySelector(options) {
  const modalDialog = getModule('modalDialog');

  const config = _.omit(options, 'scope', 'labels');
  const labels = _.extend(getLabels(options), options.labels);

  const entitySelectorProps = {
    config,
    labels,
    listHeight: calculateIdealListHeight(350),
    onChange,
    onNoEntities,
  };

  const scopeData = {
    entitySelector: entitySelectorProps,
    selected: [],
    showCustomEmptyMessage: false,
  };
  const dialog = modalDialog.open({
    attachTo: 'body',
    template: entitySelectorDialogTemplate,
    backgroundClose: true,
    ignoreEsc: false,
    noNewScope: true,
    scopeData,
  });

  function onChange(entities) {
    if (!config.multiple) {
      dialog.confirm(entities);
    } else {
      dialog.scope.selected = entities;
    }
    dialog.scope.$apply();
  }
  function onNoEntities() {
    if (labels.noEntitiesCustomHtml) {
      dialog.scope.showCustomEmptyMessage = true;
      // hacky way to recenter the modal once it's resized
      setTimeout((_) => dialog._centerOnBackground(), 0);
    }
  }

  return dialog.promise;
}

/**
 * @param {API.Field} field
 * @param {number?} currentSize
 *   Current number of entities on the field. Used to calculate the
 *   number of entities that can be selected if there are size
 *   validations. Defaults to zero.
 * @returns {Promise<API.Entity[]>}
 * @description
 * Opens a modal for the provided reference
 * field and optional list of existing links.
 */
export function openFromField(field, currentSize) {
  const config = newConfigFromField(field, currentSize || 0);
  return openByFlag(config);
}

/**
 * @param {string}   options.locale        Locale code to show entity description
 * @param {string}   options.entityType    "Entry" or "Asset"
 * @param {boolean}  options.multiple      Flag for turning on/off multiselection
 * @param {number}   options.min           Minimal number of selected entities
 * @param {number}   options.max           Maximal number of selected entities
 * @param {string[]} options.contentTypes  List of CT IDs to filter entries with
 * @param {string[]} options.mimetypeGroups List of mimetype groups to filter assetsd with
 * @returns {Promise<API.Entity[]>}
 * @description
 * Opens a modal for a configuration object
 * coming from the extension SDK "dialogs"
 * namespace.
 */
export function openFromExtension(options) {
  const config = newConfigFromExtension(options);
  return openByFlag(config).then(
    (
      selected // resolve with a single object if selecting only
    ) =>
      // one entity, resolve with an array otherwise
      options.multiple ? selected : selected?.[0] || null,
    (
      err // resolve with `null` if a user skipped selection,
    ) =>
      // reject with an error otherwise
      err ? Promise.reject(err) : null
  );
}

export function openFromExtensionSingle(options) {
  const config = newConfigFromExtension(options);

  return openByFlag(config).then(
    (selected) => selected?.[0] || null,
    (
      err // resolve with `null` if a user skipped selection,
    ) =>
      // reject with an error otherwise
      err ? Promise.reject(err) : null
  );
}

/**
 * @param {string}   options.entityType    "Entry" or "Asset"
 */
export function openFromRolesAndPermissions(entityType) {
  const config = newConfigFromExtension({ entityType, multiple: false });
  return openByFlag(config).then((selected) => selected?.[0] || null);
}
