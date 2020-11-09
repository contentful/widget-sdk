import React from 'react';
import _ from 'lodash';
import { getLabels, newConfigFromField, newConfigFromExtension } from './Config';

import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { EntitySelectorDialog } from './EntitySelectorDialog';

function openEntitySelector(options) {
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
  return openEntitySelector(config);
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
export function openFromWidget(options) {
  const config = newConfigFromExtension(options);
  return openEntitySelector(config).catch((err) => (err ? Promise.reject(err) : null));
}

/**
 * @param {string}   options.entityType    "Entry" or "Asset"
 */
export function openFromRolesAndPermissions(entityType) {
  const config = newConfigFromExtension({ entityType, multiple: false });
  return openEntitySelector(config);
}
