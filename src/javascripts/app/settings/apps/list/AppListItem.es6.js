import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  TextLink,
  Button,
  Heading,
  ModalConfirm,
  Typography,
  Paragraph
} from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import StateLink from 'app/common/StateLink.es6';
import AppIcon from '../_common/AppIcon.es6';

const styles = {
  item: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `${tokens.spacingM} 0`,
    borderBottom: `1px solid ${tokens.colorElementLight}`
  }),
  icon: css({
    display: 'flex'
  }),
  title: css({
    flexGrow: 1,
    padding: `0 ${tokens.spacingM}`,
    display: 'block'
  }),
  titleText: css({
    fontSize: tokens.fontSizeL
  }),
  actions: css({
    display: 'block',
    button: {
      marginLeft: tokens.spacingM
    }
  })
};

export default class AppListItem extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      enabled: PropTypes.bool,
      priceLine: PropTypes.string
    }).isRequired
  };

  renderLink() {
    const { id, title, installed, enabled, priceLine } = this.props.app;
    return (
      <React.Fragment>
        <div className={styles.title} data-test-id="app-title">
          <Heading element="h3" className={styles.titleText}>
            {title}
          </Heading>
          {!enabled && priceLine && (
            <TextLink icon="HelpCircle" onClick={this.openPricingInfo}>
              {priceLine}
            </TextLink>
          )}
        </div>
        <div className={styles.actions}>
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
                <Button
                  onClick={onClick}
                  buttonType="muted"
                  disabled={!enabled}
                  testId="install-app">
                  Install
                </Button>
              )}
            </StateLink>
          )}
        </div>
      </React.Fragment>
    );
  }

  openPricingInfo = () =>
    ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        isShown={isShown}
        intent="positive"
        title="Not included in your pricing plan"
        confirmLabel="Contact us"
        cancelLabel="Close"
        onConfirm={() => {
          window.open('https://www.contentful.com/contact/sales/');
          onClose();
        }}
        onCancel={onClose}>
        <Typography>
          <Paragraph>{this.props.app.priceLine}.</Paragraph>
          <Paragraph>
            Contact us if you are interested in using {this.props.app.title} App.
          </Paragraph>
        </Typography>
      </ModalConfirm>
    ));

  render() {
    const { app } = this.props;
    return (
      <div className={styles.item}>
        <div className={styles.icon}>
          <AppIcon appId={app.id} />
        </div>
        {this.renderLink()}
      </div>
    );
  }
}
