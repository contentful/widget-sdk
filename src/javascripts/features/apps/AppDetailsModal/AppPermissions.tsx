import React, { useState } from 'react';
import tokens from '@contentful/forma-36-tokens';
import { Card, Paragraph, Icon, Button, TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import SVGIcon from 'ui/Components/Icon';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import { AppIcon } from '../AppIcon';

const styles = {
  container: css({
    width: '500px',
    margin: '0 auto',
  }),
  heading: css({
    textAlign: 'center',
    marginBottom: '0.125rem',
  }),
  actions: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingM,
    'button:first-child': {
      marginRight: tokens.spacingM,
    },
  }),
  logos: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacingM,
  }),
  ctflIcon: css({
    svg: {
      width: '36px',
      height: '36px',
    },
    marginLeft: '20px',
    marginRight: tokens.spacingXs,
  }),
  arrowIcon: css({
    width: tokens.spacingXl,
    height: tokens.spacingXl,
    marginRight: `-${tokens.spacingS}`,
    fill: tokens.colorElementMid,
  }),
  permissions: css({
    marginTop: tokens.spacingL,
    '& div': css({
      marginBottom: tokens.spacingXs,
    }),
  }),
  appIcon: css({
    width: '40px',
    height: '40px',
    marginRight: tokens.spacingXs,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // If it falls back to the forma-based default icon the <img> tag is replaced
    // with an <svg> of fixed size, so we adjust the margin to align it again
    '& svg': {
      marginLeft: tokens.spacingXs,
    },
  }),
  envMeta: css({
    display: 'flex',
    justifyContent: 'center',
    '& div:first-child': css({
      marginRight: tokens.spacingXs,
    }),
  }),
  legal: css({
    p: css({
      color: tokens.colorTextLightest,
      fontSize: tokens.fontSizeS,
    }),
    'p a, a:link': css({
      color: tokens.colorTextLightest,
      fontSize: tokens.fontSizeS,
    }),
  }),
  moreP: css({
    marginTop: tokens.spacing2Xs,
    'p a, a:link': css({
      color: tokens.colorTextLightest,
      fontSize: tokens.fontSizeS,
    }),
  }),
};

const linkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

interface AppPermissionProps {
  onCancel: Function;
  onAuthorize: Function;
  title: string;
  icon?: string;
  space: string;
  envMeta: {
    environmentId: string;
    isMasterEnvironment: boolean;
    aliasId?: string;
  };
  legal?: {
    eula: string;
    privacyPolicy: string;
  };
}

export function AppPermissions(props: AppPermissionProps) {
  const { title, icon, space, envMeta, legal } = props;
  const [isUninstalling, setUninstalling] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.logos}>
        <AppIcon icon={icon} className={styles.appIcon} />
        <Icon icon="ChevronLeft" color="muted" className={styles.arrowIcon} />
        <Icon icon="ChevronRight" color="muted" className={styles.arrowIcon} />
        <SVGIcon name="contentful-logo-light" className={styles.ctflIcon} />
      </div>
      <Paragraph className={styles.heading}>
        The <b>{title} app</b> is asking for permission to access{' '}
      </Paragraph>
      <div className={styles.envMeta}>
        <div>
          <b>{space}</b>
        </div>
        <div>
          <EnvOrAliasLabel
            environmentId={envMeta.environmentId}
            isMaster={envMeta.isMasterEnvironment}
            isSelected
            colorizeFont
          />
        </div>
      </div>
      <div className={styles.permissions}>
        <Card>
          <Paragraph>
            <b>View and update</b> content and content types
          </Paragraph>
        </Card>
        <Card>
          <Paragraph>
            <b>View</b> users and locales
          </Paragraph>
        </Card>
      </div>
      <div className={styles.actions}>
        <Button
          loading={isUninstalling}
          disabled={isUninstalling}
          buttonType="primary"
          onClick={() => {
            setUninstalling(true);
            props.onAuthorize();
          }}>
          Authorize access
        </Button>
        <Button
          onClick={() => {
            props.onCancel();
          }}
          buttonType="muted">
          Cancel
        </Button>
      </div>
      {legal && (
        <div className={styles.legal}>
          <Paragraph>You can revoke access at any time by uninstalling the app.</Paragraph>
          <Paragraph className={styles.moreP}>
            By proceeding, you agree to the{' '}
            <TextLink
              {...linkProps}
              href="https://www.contentful.com/legal/de/marketplace-terms-of-service-customers/">
              Contentful Marketplace Terms of Service
            </TextLink>
          </Paragraph>
          <Paragraph>
            {legal.eula && (
              <>
                and the {title} app{' '}
                <TextLink {...linkProps} href={legal.eula}>
                  EULA
                </TextLink>
              </>
            )}
            {legal.privacyPolicy && (
              <>
                {' '}
                and{' '}
                <TextLink {...linkProps} href={legal.privacyPolicy}>
                  Privacy Policy
                </TextLink>
              </>
            )}
          </Paragraph>
        </div>
      )}
    </div>
  );
}
