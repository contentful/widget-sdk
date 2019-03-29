import { reduce, without, camelCase } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import * as logger from 'services/logger.es6';
import * as Analytics from 'analytics/Analytics.es6';

const getCountOrNull = count => (typeof count === 'number' ? count : null);

/**
 * HOC for rich text editor to add CF web-app specific actions tracking.
 *
 * Uses the RichTextEditor component's `onAction` callback to listen to
 * all actions and log them to `analytics.track()`.
 * There's an internal white list of event names. If a unknown action is
 * dispatched, e.g. because of a new feature introduced or an existing one
 * changed in RichTextEditor, then we log a warning to Bugsnag.
 *
 * @param {React.Component} Component
 * @returns {React.Component}
 */
export default function withTracking(Component) {
  return class extends React.Component {
    static propTypes = {
      widgetAPI: PropTypes.shape({
        trackEntryEditorAction: PropTypes.func.isRequired,
        entry: PropTypes.shape({
          getSys: PropTypes.func.isRequired
        }).isRequired,
        field: PropTypes.shape({
          id: PropTypes.string.isRequired,
          locale: PropTypes.string.isRequired
        }).isRequired
      }).isRequired,
      onAction: PropTypes.func
    };

    static defaultProps = {
      onAction: () => {}
    };

    actionsTrackingHandler(name, { origin, ...data }) {
      const actionName = getActionName(name, data);

      if (isKnownRichTextEditorTrackingAction(actionName)) {
        this.trackRichTextEditorAction(actionName, origin, data);
      } else if (isKnownEntryEditorTrackingAction(actionName)) {
        this.trackEntryEditorAction(actionName, data);
      } else {
        logger.logWarn(`Unexpected rich text tracking action \`${actionName}\``, {
          groupingHash: 'UnexpectedRichTextTrackingAction',
          data: {
            trackingActionName: actionName,
            originalActionName: name,
            originalActionData: { origin, ...data }
          }
        });
        return;
      }
    }

    trackEntryEditorAction(actionName, data) {
      const {
        widgetAPI: { field, trackEntryEditorAction }
      } = this.props;
      trackEntryEditorAction({ actionName, field, ...data });
    }

    trackRichTextEditorAction(actionName, origin, data) {
      const { widgetAPI } = this.props;
      const entrySys = widgetAPI.entry.getSys();
      const entryId = entrySys.id;
      const ctId = entrySys.contentType.sys.id;
      const { locale, id: fieldId } = widgetAPI.field;

      Analytics.track('text_editor:action', {
        editorName: 'RichText',
        action: actionName,
        actionOrigin: origin || null,
        entryId,
        contentTypeId: ctId,
        fieldLocale: locale,
        fieldId,
        isFullscreen: false,
        characterCountBefore: getCountOrNull(data.characterCountBefore),
        characterCountAfter: getCountOrNull(data.characterCountAfter),
        characterCountSelection: getCountOrNull(data.characterCountSelection),
        additionalData: data
      });
    }

    render() {
      return (
        <Component
          {...this.props}
          onAction={(...args) => {
            this.actionsTrackingHandler(...args);
            this.props.onAction(...args);
          }}
        />
      );
    }
  };
}

const MARKS = ['Bold', 'Underline', 'Italic', 'Code'];
const HYPERLINKS = ['Hyperlink', 'EntryHyperlink', 'AssetHyperlink'];
const EMBEDS = ['EmbeddedEntryInline', 'EmbeddedEntryBlock', 'EmbeddedAssetBlock'];
const NODES = [
  ...HYPERLINKS,
  ...EMBEDS,
  'Heading1',
  'Heading2',
  'Heading3',
  'Heading4',
  'Heading5',
  'Heading6',
  'Blockquote',
  'Hyperlink',
  'UnorderedList',
  'OrderedList',
  'Hr',
  'Paragraph'
];
const DIALOGS = [
  'CreateHyperlinkDialog',
  'EditHyperlinkDialog',
  'CreateEmbedDialogEmbeddedEntryInline',
  'CreateEmbedDialogEmbeddedEntryBlock',
  'CreateEmbedDialogEmbeddedAssetBlock',
  'RichTextCommandsPalette'
];
const DICTIONARY = {
  mark: [...MARKS],
  unmark: [...MARKS],
  insert: [...NODES],
  remove: without(NODES, ...HYPERLINKS, ...EMBEDS, 'Hr', 'Paragraph'),
  edit: [...HYPERLINKS],
  unlink: [
    'Hyperlinks' // Plural! Removes ALL hyperlinks, so not type specific.
  ],
  open: [...DIALOGS],
  cancel: [...DIALOGS]
};
const OTHER_ACTIONS = ['paste'];
const ALLOWED_EVENTS = reduce(
  DICTIONARY,
  (result, names, category) => [...result, ...names.map(name => category + name)],
  OTHER_ACTIONS
);

function isKnownEntryEditorTrackingAction(name) {
  return name === 'linkRendered';
}

function isKnownRichTextEditorTrackingAction(name) {
  return ALLOWED_EVENTS.includes(name);
}

function getActionName(name, { nodeType, markType }) {
  if (isKnownRichTextEditorTrackingAction(name)) {
    return name;
  }
  let action = name;
  if (name === 'mark' || name === 'unmark') {
    action = `${name}-${markType}`;
  } else if (nodeType) {
    action = `${name}-${nodeType}`;
  }
  return camelCase(action);
}
