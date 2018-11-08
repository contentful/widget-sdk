import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';

export default class Fullscreen extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    close: PropTypes.node
  };

  render() {
    const { children, close } = this.props;

    return (
      <div className="fullscreen--container">
        <div className="fullscreen--wrapper">
          <div className="fullscreen--header">
            <Icon name={'contentful-logo'} />
            {close}
          </div>
          {children}
        </div>
      </div>
    );
  }
}
