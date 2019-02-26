import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, Button } from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

export default function ContentModalSidebar(props) {
  return (
    <div className="entity-sidebar entity-sidebar__text-profile">
      <h2 className="entity-sidebar__heading">Fields</h2>
      <p>The content type has used {props.fieldsUsed} out of 50 fields.</p>
      {props.canEdit && (
        <Button
          testId="add-field-button"
          icon="PlusCircle"
          isFullWidth
          disabled={props.showNewFieldDialog.isDisabled()}
          extraClassNames="f36-margin-top--m"
          onClick={() => {
            props.showNewFieldDialog.execute();
          }}>
          Add field
        </Button>
      )}
      <h2 className="entity-sidebar__heading">Content type ID</h2>
      <p>Use this ID to retrieve everything related to this content type via the API.</p>
      <TextInput
        value={props.contentTypeId}
        name="contentTypeIdInput"
        id="contentTypeIdInput"
        testId="contentTypeIdInput"
        withCopyButton
        disabled
      />
      <h2 className="entity-sidebar__heading">Documentation</h2>
      <ul>
        <li>
          Read more about content types in our{' '}
          <KnowledgeBase
            target="contentModellingBasics"
            text="guide to content modelling"
            inlineText
          />
          .
        </li>
        <li>
          To learn more about the various ways of disabling and deleting fields have a look at the{' '}
          <KnowledgeBase target="field_lifecycle" text="field lifecycle" inlineText />.
        </li>
      </ul>
    </div>
  );
}

ContentModalSidebar.propTypes = {
  contentTypeId: PropTypes.string,
  canEdit: PropTypes.bool.isRequired,
  fieldsUsed: PropTypes.number.isRequired,
  showNewFieldDialog: PropTypes.object.isRequired
};
