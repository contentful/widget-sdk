import React from 'react';
import { Button, Paragraph, Subheading, Typography } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  addFieldButton: css({
    marginBottom: tokens.spacingM,
  }),
};

type Props = {
  canEdit: boolean;
  showNewFieldDialog: {
    isDisabled: () => boolean;
    execute: VoidFunction;
  };
  fieldsUsed: number;
};

export function FieldsSection(props: Props) {
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
