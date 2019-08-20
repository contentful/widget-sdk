import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import {
  Card,
  Heading,
  Subheading,
  Paragraph,
  Icon,
  Button
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import AppIcon from '../apps/_common/AppIcon.es6';

const styles = {
  card: css({
    padding: tokens.spacingL,
    border: 'none',
    boxShadow: 'none'
  }),
  subheading: css({
    marginBottom: tokens.spacingS
  }),
  heading: css({
    textAlign: 'center',
    marginBottom: tokens.spacingS
  }),
  sectionSplitter: css({
    marginTop: tokens.spacingXl
  }),
  actions: css({
    marginTop: tokens.spacingL,
    textAlign: 'center',
    button: {
      marginLeft: tokens.spacingL
    }
  }),
  logos: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL
  }),
  appIcon: css({
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs
  }),
  arrowIcon: css({
    width: tokens.spacingXl,
    height: tokens.spacingXl
  })
};

function IntentionSplitter() {
  return (
    <div
      className={css({
        height: 1,
        backgroundColor: tokens.colorElementMid
      })}
    />
  );
}

function AppIntentionItem(props) {
  return (
    <div
      className={css({
        display: 'flex',
        paddingTop: tokens.spacingM,
        paddingBottom: tokens.spacingM
      })}>
      <Icon icon="InfoCircle" color="muted" className={css({ marginTop: '2px' })} />
      <span className={css({ marginLeft: tokens.spacingS })}>{props.children}</span>
    </div>
  );
}

export default function AppPermissions(props) {
  const { appName, appId, intentions } = props;

  return (
    <div>
      <Card className={styles.card}>
        <Heading element="h1" className={styles.heading}>
          Install {appName}
        </Heading>

        <div className={styles.logos}>
          <AppIcon appId="contentful" className={styles.appIcon} />
          <Icon icon="ChevronLeft" color="muted" className={styles.arrowIcon} />
          <Icon icon="ChevronRight" color="muted" className={styles.arrowIcon} />
          <AppIcon appId={appId} className={styles.appIcon} />
        </div>
        <Subheading element="h3" className={styles.subheading}>
          Permissions
        </Subheading>
        <Paragraph>
          This app will have full permissions in the current space and environment.
        </Paragraph>
        <br />
        <Paragraph>
          It will be able to access all resources available to the user using it.
        </Paragraph>
        {intentions.length > 0 && (
          <>
            <div className={styles.sectionSplitter} />
            <Subheading element="h3" className={styles.subheading}>
              {appName} app will:
            </Subheading>
            <IntentionSplitter />
            {intentions.map(item => (
              <React.Fragment key={item}>
                <AppIntentionItem>{item}</AppIntentionItem>
                <IntentionSplitter />
              </React.Fragment>
            ))}
          </>
        )}
      </Card>
      <div className={styles.actions}>
        <Button
          onClick={() => {
            props.onCancel();
          }}
          buttonType="muted">
          Cancel
        </Button>
        <Button
          buttonType="primary"
          onClick={() => {
            props.onAuthorize();
          }}>
          Authorize access
        </Button>
      </div>
    </div>
  );
}

AppPermissions.defaultProps = {
  intentions: []
};

AppPermissions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onAuthorize: PropTypes.func.isRequired,
  appId: PropTypes.string.isRequired,
  appName: PropTypes.string.isRequired,
  intentions: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
};
