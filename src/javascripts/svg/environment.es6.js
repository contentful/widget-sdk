import React from 'react';
import PropTypes from 'prop-types';

export default class Environment extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    className: PropTypes.string
  };
  static defaultProps = {
    style: {},
    className: ''
  };

  render() {
    const { style, ...props } = this.props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16px"
        height="16px"
        viewBox="0 0 16.1 12"
        style={{ enableBackground: 'new 0 0 16.1 12', ...style }}
        {...props}>
        <path d="M16.1,7.5l-1.7,1.7l-2.2-2.1l-1,1l2.2,2.2L11.6,12h4.5V7.5z M16.1,4.5V0h-4.5l1.7,1.7L9.8,5.2H4.1v1.5h6.3l4-4L16.1,4.5z" />
      </svg>
    );
  }
}