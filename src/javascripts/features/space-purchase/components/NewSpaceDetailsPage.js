import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Button,
  Heading,
  Subheading,
  Card,
  Typography,
  TextField,
  Form,
} from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import TemplateSelector from 'app/SpaceWizards/shared/TemplateSelector';

const styles = {
  form: css({
    '& > div:last-child': {
      marginBottom: 0,
    },
  }),
  card: css({
    maxWidth: '700px',
    padding: tokens.spacingXl,
    borderRadius: '4px',
  }),
  cardTitle: css({
    marginBottom: tokens.spacingL,
  }),
  buttonsContainer: css({
    display: 'flex',
    justifyContent: 'flex-end',
    '& button:last-child': {
      marginLeft: tokens.spacingM,
    },
  }),
  sectionHeading: css({
    marginBottom: tokens.spacingL,
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
  spaceIsFree,
}) => {
  return (
    <section aria-labelledby="new-space-details-section" data-test-id="new-space-details-section">
      <Grid columns={1} rows="repeat(2, 'auto')">
        <Heading
          id="new-space-details-section-heading"
          element="h2"
          testId="space-selection.heading"
          className={styles.sectionHeading}>
          Set up your new space
        </Heading>

        <Card testId="space-card" className={styles.card}>
          <Typography>
            <Subheading className={styles.cardTitle} element="h3" testId="space-heading">
              Enter your space details{' '}
              <span role="img" aria-label="Pencil">
                ✏️
              </span>
            </Subheading>
          </Typography>
          <Form className={styles.form} spacing="condensed" onSubmit={onSubmit}>
            <TextField
              labelText="Name your space"
              name="space-name"
              id="space-name"
              testId="space-name"
              autoFocus
              value={spaceName}
              countCharacters
              textInputProps={{
                type: 'text',
                placeholder: 'My space',
                maxLength: 30,
              }}
              onChange={(e) => onChangeSpaceName(e.target.value)}
            />

            <TemplateSelector
              isNewSpacePurchaseFlow={true}
              onSelect={onChangeSelectedTemplate}
              templates={templatesList}
              selectedTemplate={selectedTemplate}
            />

            <div className={styles.buttonsContainer}>
              <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="muted">
                Back
              </Button>
              <Button
                onClick={onSubmit}
                disabled={spaceName === ''}
                testId="next-step-new-details-page">
                {spaceIsFree ? 'Create space' : 'Continue to pay'}
              </Button>
            </div>
          </Form>
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
  spaceIsFree: PropTypes.bool,
};
