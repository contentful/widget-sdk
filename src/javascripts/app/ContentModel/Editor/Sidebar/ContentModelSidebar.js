import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  TextInput,
  Button,
  Paragraph,
  Subheading,
  Typography
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

const styles = {
  addFieldButton: css({
    marginBottom: tokens.spacingM
  })
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
    execute: PropTypes.func.isRequired
  }).isRequired,
  fieldsUsed: PropTypes.number.isRequired
};

export function ContentTypeIdSection(props) {
  return (
    <React.Fragment>
      <Subheading className="entity-sidebar__heading">Content type ID</Subheading>
      <Typography>
        <Paragraph>
          Use this ID to retrieve everything related to this content type via the API.
        </Paragraph>
      </Typography>
      <TextInput
        value={props.contentTypeId}
        name="contentTypeIdInput"
        id="contentTypeIdInput"
        testId="contentTypeIdInput"
        withCopyButton
        disabled
      />
    </React.Fragment>
  );
}

ContentTypeIdSection.propTypes = {
  contentTypeId: PropTypes.string.isRequired
};

export function DocumentationSection() {
  return (
    <React.Fragment>
      <Subheading className="entity-sidebar__heading">Documentation</Subheading>
      <Typography>
        <Paragraph>
          Read more about content types in our{' '}
          <KnowledgeBase
            target="contentModellingBasics"
            text="guide to content modelling"
            inlineText
          />
          .
        </Paragraph>
        <Paragraph>
          To learn more about the various ways of disabling and deleting fields have a look at the{' '}
          <KnowledgeBase target="field_lifecycle" text="field lifecycle" inlineText />.
        </Paragraph>
      </Typography>
    </React.Fragment>
  );
}
