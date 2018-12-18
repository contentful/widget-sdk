import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isHotKey from 'is-hotkey';

export default class Switch extends React.Component {
  onKeyUp = e => {
    if (isHotKey('enter', e)) {
      this.props.onToggle(!this.props.on);
    }
  };

  render() {
    return (
      <div className="algolia-app__config-fields-switch-field">
        <div
          tabIndex={0}
          onClick={this.props.onToggle}
          onKeyUp={this.onKeyUp}
          className={classNames(`algolia-app__config-fields-switch`, {
            'algolia-app__config-fields-switch__on': this.props.on
          })}
        />
        {this.props.children}
      </div>
    );
  }
}

Switch.propTypes = {
  onToggle: PropTypes.func.isRequired,
  on: PropTypes.bool.isRequired
};
