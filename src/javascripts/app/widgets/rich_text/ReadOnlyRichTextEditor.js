/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import buildWidgetApi from 'app/widgets/WidgetApi/buildWidgetApi';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import RichTextEditor from './RichTextEditor';

export default class ReadOnlyRichTextEditor extends React.Component {
  static propTypes = {
    value: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired
  };

  render() {
    const { value, locale } = this.props;
    const widgetAPI = buildWidgetApi({
      field: {
        locale
      },
      currentUrl: window.location
    });
    return (
      <WidgetAPIContext.Provider value={{ widgetAPI }}>
        <RichTextEditor
          isToolbarHidden
          actionsDisabled
          readOnly
          widgetAPI={widgetAPI}
          value={value}
          isDisabled={true}
        />
      </WidgetAPIContext.Provider>
    );
  }
}
