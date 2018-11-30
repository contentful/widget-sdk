import React from 'react';
import PropTypes from 'prop-types';

export default class FormSection extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    collapsible: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
  };

  static defaultProps = {
    collapsible: false
  };

  constructor(props) {
    super(props);
    this.state = { collapsed: false };
  }

  render() {
    const { collapsed } = this.state;
    const { title, collapsible, children } = this.props;

    return (
      <div className="settings-form__section">
        <div className="settings-form__header">
          <h3>{title}</h3>
          {collapsible && collapsed && (
            <button className="btn-link" onClick={() => this.setState({ collapsed: false })}>
              <i className="fa fa-chevron-down" />
              Show details
            </button>
          )}
          {collapsible && !collapsed && (
            <button className="btn-link" onClick={() => this.setState({ collapsed: true })}>
              <i className="fa fa-chevron-up" />
              Hide details
            </button>
          )}
        </div>
        <div className="settings-form__content">{!collapsed && children}</div>
      </div>
    );
  }
}
