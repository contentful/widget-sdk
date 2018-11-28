import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Icon from 'ui/Components/Icon.es6';

export default class Fullscreen extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    close: PropTypes.node,
    gradient: PropTypes.bool
  };

  render() {
    const { children, close, gradient } = this.props;

    const containerClass = classnames(
      'fullscreen--container',
      gradient && `fullscreen--container--with-gradient`
    );

    return (
      <div className={containerClass}>
        <div className="fullscreen--wrapper">
          <div className="fullscreen--header">
            {!gradient && <Icon name={'contentful-logo'} />}
            {gradient && <Icon name="contentful-logo-light" />}
            {close}
          </div>
          {children}
        </div>
      </div>
    );
  }
}
