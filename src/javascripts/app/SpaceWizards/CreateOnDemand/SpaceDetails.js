import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import TemplateSelector from '../shared/TemplateSelector';
import { Price } from 'core/components/formatting';

import {
  TextField,
  Button,
  Form,
  Heading,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';

const classes = {
  center: css({
    textAlign: 'center',
  }),
  confirmButton: css({
    textAlign: 'center',
    margin: '1.2em 0',
  }),
  nameTemplateContainer: css({
    width: '450px',
    margin: '0 auto',
  }),
};

export default function SpaceDetails(props) {
  const {
    selectedPlan,
    templates,
    selectedTemplate,
    spaceName,
    onChangeSpaceName,
    onChangeSelectedTemplate,
    onSubmit,
  } = props;

  return (
    <Typography testId="space-details">
      <Heading className={classes.center}>Choose a name</Heading>
      <Paragraph className={classes.center}>
        You are about to create a {selectedPlan.name.toLowerCase()} space for{' '}
        <strong>
          <Price value={selectedPlan.price} unit="month" />
        </strong>
        .
      </Paragraph>
      <div className={classes.nameTemplateContainer}>
        <Form onSubmit={onSubmit}>
          <TextField
            labelText="Space name"
            placeholder="Space name"
            name="name"
            id="name"
            testId="space-name"
            required
            autoFocus
            value={spaceName}
            onChange={(e) => onChangeSpaceName(e.target.value)}
          />
        </Form>
      </div>
      <TemplateSelector
        onSelect={onChangeSelectedTemplate}
        templates={templates}
        selectedTemplate={selectedTemplate}
      />
      <div className={classes.confirmButton}>
        <Button testId="go-to-confirmation-button" disabled={spaceName === ''} onClick={onSubmit}>
          Proceed to confirmation
        </Button>
      </div>
    </Typography>
  );
}

SpaceDetails.propTypes = {
  selectedPlan: PropTypes.object,
  templates: PropTypes.array.isRequired,
  spaceName: PropTypes.string.isRequired,
  selectedTemplate: PropTypes.object,
  onChangeSpaceName: PropTypes.func.isRequired,
  onChangeSelectedTemplate: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
