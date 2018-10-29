import PropTypes from 'prop-types';
import { includes } from 'lodash';

/**
 * All known origins for richTextAPI.logAction(action, {origin: ...})
 * @type {object}
 */
export const actionOrigin = {
  TOOLBAR: 'toolbar-icon',
  SHORTCUT: 'shortcut',
  VIEWPORT: 'viewport-interaction'
};

/**
 * Creates a richTextAPI that can be passed to editor or toolbar widgets.
 *
 * @param {object} widgetAPI
 * @param {function } onAction
 * @returns {{widgetAPI: {object}, logAction: {function}}}
 */
export const newPluginAPI = ({ widgetAPI, onAction }) => ({
  widgetAPI,
  /**
   * Allows a plugin to dispatch an action that can be consumed via the
   * RichTextEditor's `onAction` callback.
   *
   * @param {string} name
   * @param {object} data
   * @param {string} data.origin One of `actionOrigin`.
   */
  logAction: (name, data) => {
    const { origin } = data;
    if (origin && !includes(actionOrigin, origin)) {
      throw new Error(`Unknown action ${origin} in action ${name}`);
    }
    onAction(name, data);
  }
});

/**
 * Describes the prop types a rich text editor plugin can expect.
 * @type {object}
 */
export const EDITOR_PLUGIN_PROP_TYPES = {
  richTextAPI: PropTypes.shape({
    widgetAPI: PropTypes.object.isRequired,
    logAction: PropTypes.func.isRequired
  })
};

/**
 * Describes the prop types a rich text toolbar plugin can expect.
 * @type {object}
 */
export const TOOLBAR_PLUGIN_PROP_TYPES = {
  ...EDITOR_PLUGIN_PROP_TYPES,
  change: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
};
