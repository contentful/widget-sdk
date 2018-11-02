import { reduce, without, camelCase } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { track } from 'analytics/Analytics.es6';

export default function withTracking(Component) {
  return class extends React.Component {
    static propTypes = {
      widgetAPI: PropTypes.object.isRequired,
      onAction: PropTypes.func
    };
    static defaultProps = {
      onAction: () => {}
    };

    actionsTrackingHandler(name, { origin, ...data }) {
      const { widgetAPI } = this.props;
      const entrySys = widgetAPI.entry.getSys();
      const entryId = entrySys.id;
      const ctId = entrySys.contentType.sys.id;
      const { locale, id: fieldId } = widgetAPI.field;
      track('text_editor:action', {
        editorName: 'RichText',
        action: getActionName(name, data),
        actionOrigin: origin || null,
        entryId: entryId,
        contentTypeId: ctId,
        fieldLocale: locale,
        fieldId: fieldId,
        isFullscreen: false,
        characterCountBefore: null,
        characterCountAfter: null,
        characterCountSelection: null,
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
  'CreateEmbedDialogEmbeddedAssetBlock'
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
const ALLOWED_EVENTS = reduce(
  DICTIONARY,
  (result, names, category) => {
    return [...result, ...names.map(name => category + name)];
  },
  []
);

function getActionName(name, { nodeType, markType }) {
  let action = name;
  if (name === 'mark' || name === 'unmark') {
    action = `${name}-${markType}`;
  } else if (nodeType) {
    action = `${name}-${nodeType}`;
  }
  const actionName = camelCase(action);
  if (!ALLOWED_EVENTS.includes(actionName)) {
    throw new Error(`Unexpected rich text action ${actionName}`);
  }
  return actionName;
}
