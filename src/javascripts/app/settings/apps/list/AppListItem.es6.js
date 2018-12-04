import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextLink, Button, Heading } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import AppIcon from '../_common/AppIcon.es6';

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired
    }).isRequired
  };

  renderLink() {
    const { id, title, installed } = this.props.app;
    return (
      <React.Fragment>
        <div className="apps-list-item__title">
          <StateLink to="^.detail" params={{ appId: id }}>
            <Heading element="h3" extraClassNames="apps-list-item__title-text">
              {title}
            </Heading>
          </StateLink>
        </div>
        <div className="apps-list-item__actions">
          {installed && (
            <StateLink to="^.detail" params={{ appId: id }}>
              {({ onClick }) => (
                <TextLink onClick={onClick} linkType="primary">
                  View configuration
                </TextLink>
              )}
            </StateLink>
          )}
          {!installed && (
            <StateLink to="^.detail" params={{ appId: id }}>
              {({ onClick }) => (
                <Button onClick={onClick} buttonType="muted">
                  Install
                </Button>
              )}
            </StateLink>
          )}
        </div>
      </React.Fragment>
    );
  }

  renderSoon() {
    return (
      <React.Fragment>
        <div className="apps-list-item__title">
          <Heading element="h3" extraClassNames="apps-list-item__title-text">
            {this.props.app.title}
          </Heading>
        </div>
        <div className="apps-list-item__actions">
          <Button buttonType="muted" disabled>
            Coming soon
          </Button>
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { app } = this.props;
    return (
      <div className="apps-list-item">
        <div className="apps-list-item__icon">
          <AppIcon appId={app.id} />
        </div>
        {!app.soon && this.renderLink()}
        {app.soon && this.renderSoon()}
      </div>
    );
  }
}
