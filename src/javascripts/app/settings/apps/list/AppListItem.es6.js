import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import AppIcon from '../_common/AppIcon.es6';

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    }).isRequired
  };

  render() {
    const { app } = this.props;
    return (
      <div className="apps-list-item">
        <div className="apps-list-item__icon">
          <AppIcon appId={app.id} />
        </div>
        {app.soon ? this.renderSoon() : this.renderLink()}
      </div>
    );
  }

  renderLink() {
    const { id, title } = this.props.app;
    return (
      <React.Fragment>
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
        </div>
      </React.Fragment>
    );
  }

  renderSoon() {
    return (
      <React.Fragment>
        <div className="apps-list-item__title">{this.props.app.title}</div>
        <div className="apps-list-item__actions">Coming soon!</div>
      </React.Fragment>
    );
  }
}
