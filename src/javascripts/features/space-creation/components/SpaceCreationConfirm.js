import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Heading,
  Paragraph,
  Card,
  Tag,
  Subheading,
  Button,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { SpaceCreationState } from '../context';
import { SpacePlanResourceList } from 'features/space-plan-assignment';

const styles = {
  text: css({
    textAlign: 'center',
  }),
  content: css({
    width: '520px',
    margin: 'auto',
  }),
  tooltipPointer: css({ cursor: 'pointer' }),
};

export function SpaceCreationConfirm({ onPrev, onNext, inProgress }) {
  const {
    state: { spaceName, selectedPlan },
  } = useContext(SpaceCreationState);

  return (
    <>
      <Typography className={styles.text}>
        <Heading>One more thing ☝️</Heading>
        <Paragraph>
          {`You are about to create a new ${selectedPlan.name} space. Check one last time to make sure everything is in order, then confirm.`}
        </Paragraph>
      </Typography>

      <section className={styles.content}>
        <Card padding="large">
          <Typography>
            <Tag tagType="muted">Your new space</Tag>
            <Subheading>{`${spaceName} (${selectedPlan.name})`}</Subheading>
          </Typography>
          <SpacePlanResourceList plan={selectedPlan} />
          <Flex justifyContent="flex-end" alignItems="center" marginTop="spacingL">
            <Button buttonType="muted" onClick={onPrev} disabled={inProgress} testId="go-back-btn">
              Back
            </Button>
            <Flex marginLeft="spacingM">
              <Button
                buttonType="positive"
                onClick={onNext}
                loading={inProgress}
                testId="confirm-btn">
                Confirm and create
              </Button>
            </Flex>
          </Flex>
        </Card>
      </section>
    </>
  );
}

SpaceCreationConfirm.propTypes = {
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  inProgress: PropTypes.bool,
};
