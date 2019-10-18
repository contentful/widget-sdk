import React from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';

export default class WidgetRenderWarning extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired
  };

  render() {
    const { message } = this.props;
    const canUpdateContentTypes = !accessChecker.shouldHide('update', 'contentType');

    let title = '';

    if (message === 'incompatible') {
      title = 'The selected widget cannot be used with this field.';
    } else if (message === 'missing') {
      title = 'The selected widget does not exist anymore.';
    }

    return (
      <Note noteType="warning" title={title}>
        {canUpdateContentTypes ? 'Please select a valid widget in the Content Model section.' : ''}
        {!canUpdateContentTypes
          ? 'Please contact your Contenful administrator to update the settings in the Content Model section.'
          : ''}
      </Note>
    );
  }
}
