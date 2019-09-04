import React from 'react';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import * as CreateSpace from 'services/CreateSpace.es6';
import {
  Subheading,
  Button,
  Paragraph,
  Card,
  Typography
} from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
import { trackClickCTA } from 'app/home/tracking.es6';

const styles = {
  section: css({ padding: tokens.spacingXl, display: 'flex' }),
  heading: css({ fontSize: tokens.fontSize2Xl }),
  buttonSection: css({ marginTop: tokens.spacingXl }),
  buttonMargin: css({ marginLeft: tokens.spacingM }),
  firstColumn: css({ width: '540px' }),
  image: css({
    width: '239px',
    height: '181px',
    backgroundSize: '239px 181px',
    marginLeft: tokens.spacingXl
  })
};

const ResumeOnboarding = () => {
  const $state = getModule('$state');
  const spaceContext = getModule('spaceContext');
  const currOrgId = spaceContext.organization.sys.id;
  // this is in render as we want this component to resume using what the latest value
  // in the localStorage is and not what the value was when it was mounted
  const handleResume = async () => {
    const currentStep = {
      params: { spaceId: spaceContext.space && spaceContext.space.getId() },
      path: 'spaces.detail.onboarding.copy'
    };
    $state.go(currentStep.path, currentStep.params);
  };

  const handleCreateNewSpace = () => {
    trackClickCTA('resume_onboarding:create_new_space_button');
    return CreateSpace.showDialog(currOrgId);
  };

  return (
    <Card className={styles.section}>
      <Typography className={styles.firstColumn}>
        <Subheading className={styles.heading}>
          Would you like to continue to deploy a modern stack website?
        </Subheading>
        <Paragraph>
          You’ll copy the repository for a blog, explore the blog content structure and deploy.
        </Paragraph>
        <div className={styles.buttonSection}>
          <Button onClick={handleResume} data-test-id="ms-resume-onboarding">
            Yes, deploy a blog in 3 steps
          </Button>
          <Button
            className={styles.buttonMargin}
            onClick={handleCreateNewSpace}
            data-test-id="ms-create-new-space">
            No, create a new space
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
};

export default ResumeOnboarding;
