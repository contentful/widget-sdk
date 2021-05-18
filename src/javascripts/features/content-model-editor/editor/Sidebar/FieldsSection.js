import React from 'react';
import { Button, Paragraph, Subheading, Typography } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  addFieldButton: css({
    marginBottom: tokens.spacingM,
  }),
};

export function FieldsSection(props) {
  return (
    <React.Fragment>
      <Subheading className="entity-sidebar__heading">Fields</Subheading>
      <Typography>
        <Paragraph>The content type has used {props.fieldsUsed} out of 50 fields.</Paragraph>
      </Typography>
      {props.canEdit && (
        <Button
          testId="add-field-button"
          icon="PlusCircle"
          isFullWidth
          disabled={props.showNewFieldDialog.isDisabled()}
          className={styles.addFieldButton}
          onClick={() => {
            props.showNewFieldDialog.execute();
          }}>
          Add field
        </Button>
      )}
    </React.Fragment>
  );
}

FieldsSection.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  showNewFieldDialog: PropTypes.shape({
    isDisabled: PropTypes.func.isRequired,
    execute: PropTypes.func.isRequired,
  }).isRequired,
  fieldsUsed: PropTypes.number.isRequired,
};
