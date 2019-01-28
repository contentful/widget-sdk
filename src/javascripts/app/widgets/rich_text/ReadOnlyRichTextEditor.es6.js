/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import buildWidgetApi from 'app/widgets/WidgetApi/buildWidgetApi.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import RichTextEditor from './RichTextEditor.es6';

export default class ReadOnlyRichTextEditor extends React.Component {
  static propTypes = {
    value: PropTypes.object
  };

  render() {
    const widgetAPI = buildWidgetApi({
      field: this.props.value,
      currentUrl: window.location
    });
    return (
      <WidgetAPIContext.Provider value={{ widgetAPI }}>
        <RichTextEditor
          {...this.props}
          isToolbarHidden
          readOnly
          widgetAPI={widgetAPI}
          value={this.props.value}
          isDisabled={true}
        />
      </WidgetAPIContext.Provider>
    );
  }
}
