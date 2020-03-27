import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Icon from 'ui/Components/Icon';

export default class Fullscreen extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    close: PropTypes.node,
    gradient: PropTypes.bool,
  };

  render() {
    const { children, close, gradient } = this.props;

    const containerClass = classnames({
      'fullscreen--container': !gradient,
      'fullscreen--container-with-gradient': gradient,
    });

    return (
      <div className={containerClass}>
        <div className="fullscreen--wrapper">
          <div className="fullscreen--header">
            <Icon name={`contentful-logo${gradient ? `-light` : ''}`} />
            {close}
          </div>
          {children}
        </div>
      </div>
    );
  }
}
