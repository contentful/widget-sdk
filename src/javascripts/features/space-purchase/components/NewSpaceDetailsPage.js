import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Heading,
  Card,
  Typography,
  TextField,
  Form,
} from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import cn from 'classnames';
import tokens from '@contentful/forma-36-tokens';
import TemplateSelector from 'app/SpaceWizards/shared/TemplateSelector';

const styles = {
  buttonsContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  card: css({
    width: '700px',
    padding: tokens.spacingL,
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
  }),
};

export const NewSpaceDetailsPage = ({
  navigateToPreviousStep,
  spaceName,
  onChangeSpaceName,
  templatesList,
  selectedTemplate,
  onChangeSelectedTemplate,
  onSubmit,
}) => {
  return (
    <section aria-labelledby="new-space-details-section">
      <Grid columns={1} rows="repeat(2, 'auto')" columnGap="spacingL" rowGap="spacingM">
        <Heading
          id="new-space-details-section-heading"
          element="h2"
          testId="space-selection.heading"
          className={styles.sectionHeading}>
          Set up your new space
        </Heading>

        <Card testId="space-card" className={cn(styles.fullRow, styles.card)}>
          <Typography>
            <Heading element="h3" testId="space-heading">
              Enter your space details
            </Heading>

            <Form onSubmit={onSubmit}>
              <TextField
                labelText="Name your space"
                placeholder="Name your space"
                name="name"
                id="name"
                testId="space-name"
                autoFocus
                value={spaceName}
                onChange={(e) => onChangeSpaceName(e.target.value)}
              />
            </Form>
          </Typography>

          <TemplateSelector
            isNewSpacePurchaseFlow={true}
            onSelect={onChangeSelectedTemplate}
            templates={templatesList}
            selectedTemplate={selectedTemplate}
          />

          <div className={styles.buttonsContainer}>
            <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="naked">
              Back
            </Button>
            <Button
              onClick={onSubmit}
              disabled={spaceName === ''}
              testId="next-step-new-details-page">
              Continue to pay
            </Button>
          </div>
        </Card>
      </Grid>
    </section>
  );
};

NewSpaceDetailsPage.propTypes = {
  navigateToPreviousStep: PropTypes.func.isRequired,
  onChangeSpaceName: PropTypes.func.isRequired,
  spaceName: PropTypes.string.isRequired,
  templatesList: PropTypes.array.isRequired,
  selectedTemplate: PropTypes.object,
  onChangeSelectedTemplate: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
