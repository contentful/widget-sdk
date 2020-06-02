import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Price } from 'core/components/formatting';

import { Paragraph, Typography, Heading, Button } from '@contentful/forma-36-react-components';

const styles = {
  confirmButton: css({
    margin: '1.2em 0',
    textAlign: 'center',
  }),
  center: css({
    textAlign: 'center',
  }),
};

export default function ConfirmScreenNormal(props) {
  const {
    selectedPlan,
    creating,
    onConfirm,
    organization,
    currentSubscriptionPrice,
    spaceName,
    selectedTemplate,
  } = props;

  return (
    <Typography>
      <Heading className={styles.center}>Confirm your selection</Heading>
      <Paragraph className={styles.center}>
        Make sure everything is in order before creating your space.
      </Paragraph>
      <Paragraph>
        {selectedPlan.price > 0 && (
          <>
            You are about to purchase a {selectedPlan.name.toLowerCase()} space for{' '}
            <strong>
              <Price value={selectedPlan.price} unit="month" />
            </strong>{' '}
            for the organization <em>{organization.name}</em>. This will increase your
            organization’s subscription to{' '}
            <strong>
              <Price value={currentSubscriptionPrice + selectedPlan.price} unit="month" />
            </strong>
            .{' '}
          </>
        )}
        {selectedPlan.price === 0 && (
          <>
            You are about to create a free space for the organization <em>{organization.name}</em>{' '}
            and it won&apos;t change your organization&apos;s subscription.{' '}
          </>
        )}
        <>
          The space’s name will be <em>{spaceName}</em>
          {selectedTemplate && ', and we will fill it with example content'}
          {'. '}
          <br />
          <br />
          If everything looks okay, click <strong>Confirm and create space</strong> to create your
          space.
        </>
      </Paragraph>
      <div className={styles.confirmButton}>
        <Button disabled={creating} loading={creating} onClick={onConfirm} buttonType="positive">
          Confirm and create space
        </Button>
      </div>
    </Typography>
  );
}

ConfirmScreenNormal.propTypes = {
  selectedPlan: PropTypes.object.isRequired,
  creating: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  organization: PropTypes.object.isRequired,
  currentSubscriptionPrice: PropTypes.number.isRequired,
  spaceName: PropTypes.string.isRequired,
  selectedTemplate: PropTypes.object,
};
