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
import { Flex, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { SpaceCreationState } from '../context';
import { SpacePlanResourceList } from 'features/space-plan-assignment';

const styles = {
  text: css({
    textAlign: 'center',
  }),
  content: css({
    width: tokens.contentWidthText,
    margin: 'auto',
  }),
  header: css({
    marginBottom: tokens.spacingM,
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
        <Heading>Hang on, your new space is on its way </Heading>
        <Paragraph>
          {`You are about to create a new ${selectedPlan.name} space. Check one last time to make sure everything is in order, then confirm.`}
        </Paragraph>
      </Typography>

      <section className={styles.content}>
        <Card padding="large">
          <Grid columns="1fr 0 1fr" rows="2" columnGap="spacing2Xl">
            <div>
              <header className={styles.header}>
                <Tag tagType="muted">Your new space</Tag>
                <Subheading>{`${spaceName} (${selectedPlan.name})`}</Subheading>
              </header>
              <SpacePlanResourceList plan={selectedPlan} />
            </div>
          </Grid>
        </Card>
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
          <Button
            buttonType="muted"
            onClick={onPrev}
            disabled={inProgress}
            icon="ChevronLeft"
            testId="go-back-btn">
            Go back
          </Button>
          <Button buttonType="positive" onClick={onNext} loading={inProgress} testId="confirm-btn">
            Confim and create
          </Button>
        </Flex>
      </section>
    </>
  );
}

SpaceCreationConfirm.propTypes = {
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  inProgress: PropTypes.bool,
};
