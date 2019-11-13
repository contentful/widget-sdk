import React from 'react';
import PropTypes from 'prop-types';
import { isArray } from 'lodash';

export default class ForbiddenPage extends React.Component {
  static propTypes = {
    overHeadline: PropTypes.string,
    headline: PropTypes.string,
    message: PropTypes.any
  };

  static defaultProps = {
    overHeadline: 'Access forbidden (403)',
    headline: 'You don’t have access to this page.',
    message: 'Contact the administrator of this space to get access.'
  };

  render() {
    const { overHeadline, headline, message, ...restProps } = this.props;
    const messages = isArray(message) ? message : [message];

    return (
      <div {...restProps} className="workbench workbench-forbidden x--center">
        <div className="workbench-forbidden__over-headline">{overHeadline}</div>
        <div className="workbench-forbidden__headline">{headline}</div>
        {messages.map((item, index) => (
          <div className="workbench-forbidden__message" key={'messsage-' + index}>
            {item}
          </div>
        ))}
      </div>
    );
  }
}
