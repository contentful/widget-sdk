import { camelCase } from 'lodash';
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
        characterCountSelection: null
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

function getActionName(name, { nodeType, markType }) {
  let action = name;
  if (name === 'mark' || name === 'unmark') {
    action = `${name}-${markType}`;
  } else if (nodeType) {
    action = `${name}-${nodeType}`;
  }
  return camelCase(action);
}
