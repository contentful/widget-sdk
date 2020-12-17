import React, { useContext } from 'react';
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
import { Flex, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import TemplateSelector from 'app/SpaceWizards/shared/TemplateSelector';
import { actions, SpaceCreationState } from '../context';

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
  sectionHeading: css({
    marginBottom: tokens.spacingL,
    fontWeight: tokens.fontWeightMedium,
  }),
};

export const SpaceDetailsSetupStep = ({ onBack, onSubmit }) => {
  const {
    state: { spaceName, selectedTemplate, templatesList, selectedPlan },
    dispatch,
  } = useContext(SpaceCreationState);

  return (
    <section aria-labelledby="new-space-details-section" data-test-id="new-space-details-section">
      <Grid columns={1} rows="repeat(2, 'auto')">
        <Heading
          id="new-space-details-section-heading"
          element="h2"
          testId="space-selection.heading"
          className={styles.sectionHeading}>
          Set up your new {selectedPlan.name} space
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
              onChange={(e) => dispatch({ type: actions.SET_SPACE_NAME, payload: e.target.value })}
            />

            <TemplateSelector
              isNewSpacePurchaseFlow={true}
              onSelect={(template) => {
                dispatch({ type: actions.SET_SELECTED_TEMPLATE, payload: template });
              }}
              templates={templatesList}
              selectedTemplate={selectedTemplate}
            />

            <Flex justifyContent="flex-end" alignItems="center">
              <Button onClick={onBack} testId="navigate-back" buttonType="muted">
                Back
              </Button>
              <Flex marginLeft="spacingM">
                <Button
                  onClick={onSubmit}
                  disabled={spaceName === ''}
                  testId="next-step-new-details-page">
                  Continue
                </Button>
              </Flex>
            </Flex>
          </Form>
        </Card>
      </Grid>
    </section>
  );
};

SpaceDetailsSetupStep.propTypes = {
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
