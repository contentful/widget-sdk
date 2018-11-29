import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import AppIcon from '../_common/AppIcon.es6';

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool
    }).isRequired,
    onUninstallClick: PropTypes.func.isRequired
  };

  onUninstallClick = () => {
    this.props.onUninstallClick(this.props.app);
  };

  render() {
    const { title, id, installed } = this.props.app;
    return (
      <div className="apps-list-item">
        <div className="apps-list-item__icon">
          <AppIcon appId={id} />
        </div>
        <div className="apps-list-item__title">
          <StateLink to="^.detail" params={{ appId: id }}>
            {title}
          </StateLink>
        </div>
        <div className="apps-list-item__actions">
          <StateLink to="^.detail" params={{ appId: id }}>
            {({ onClick }) => (
              <TextLink onClick={onClick} linkType="primary">
                View details
              </TextLink>
            )}
          </StateLink>
          {installed && (
            <TextLink onClick={this.onUninstallClick} linkType="negative">
              Uninstall
            </TextLink>
          )}
        </div>
      </div>
    );
  }
}
