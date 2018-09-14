import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@contentful/ui-component-library';

export default class Pill extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    tooltip: PropTypes.string
  };

  static defaultProps = {
    tooltip: null
  };

  render() {
    const { text, tooltip } = this.props;
    return (
      <React.Fragment>
        <span className="pill" data-tip={tooltip || ''}>
          {text}
        </span>
        <Tooltip />
      </React.Fragment>
    );
  }
}
