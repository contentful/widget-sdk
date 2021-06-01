import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import * as TokenStore from 'services/TokenStore';
import { openDeleteSpaceDialog } from 'features/space-settings';
import {
  Subheading,
  DisplayText,
  Button,
  Paragraph,
  Card,
  Typography,
} from '@contentful/forma-36-react-components';
import { trackClickCTA } from 'features/space-home';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { go } from 'states/Navigator';
import { router } from 'core/react-routing';

const store = getBrowserStorage();

const styles = {
  section: css({ padding: tokens.spacingXl, display: 'flex' }),
  deployExampleDiv: css({
    marginBottom: tokens.spacingXl,
  }),
  heading: css({ fontSize: tokens.fontSize2Xl }),
  firstColumn: css({ width: '540px' }),
  image: css({
    width: '239px',
    height: '181px',
    backgroundSize: '239px 181px',
    marginLeft: tokens.spacingXl,
    alignSelf: 'center',
  }),
};

export default function ResumeOnboarding({ spaceId }) {
  // this is in render as we want this component to resume using what the latest value
  // in the localStorage is and not what the value was when it was mounted
  const handleResume = async () => {
    let currentStep = store.get(`${getStoragePrefix()}:currentStep`);

    trackClickCTA('resume_onboarding:resume_deploy_button');

    if (!currentStep) {
      currentStep = {
        path: 'spaces.detail.onboarding.copy',
        params: { spaceId },
      };
    }
    router.navigate({ path: currentStep.path, ...currentStep.params });
  };

  const handleDeleteSpace = async () => {
    const space = await TokenStore.getSpace(spaceId);

    trackClickCTA('resume_onboarding:delete_space');

    openDeleteSpaceDialog({
      space,
      onSuccess: () => {
        go({
          path: 'home',
        });
      },
    });
  };

  return (
    <Card className={styles.section}>
      <Typography className={styles.firstColumn}>
        <div className={styles.deployExampleDiv}>
          <DisplayText>Play with our example or create your own content model</DisplayText>
          <Paragraph>
            Not sure where to begin? You can use our example blog to get familiar with content
            modeling. You can deploy the blog in 3 simple steps.
          </Paragraph>
          <Button onClick={handleResume} data-test-id="resume-onboarding-cta">
            Deploy example
          </Button>
        </div>
        <div>
          <Subheading>Create your own content model</Subheading>
          <Paragraph>
            To start from scratch, delete this space and then add a new space. Deleting this space
            can’t be undone.
          </Paragraph>
          <Button buttonType="negative" onClick={handleDeleteSpace} data-test-id="delete-space-cta">
            Delete space
          </Button>
        </div>
      </Typography>
      <div
        role="img"
        aria-label="View of the Gatsby App"
        className={cx(styles.image, 'background-image_gatsby-starter')}
      />
    </Card>
  );
}

ResumeOnboarding.propTypes = {
  spaceId: PropTypes.string.isRequired,
};
