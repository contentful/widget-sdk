import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import { Button } from '@contentful/forma-36-react-components';
import { CreateEntryMenuTrigger } from '@contentful/field-editor-reference';

const styles = {
  createEntryButton: css({
    verticalAlign: 'top',
  }),
};

const CreateEntryButton = ({
  contentTypes,
  onSelect,
  text,
  testId,
  suggestedContentTypeId,
  disabled,
}) => {
  const suggestedContentType = contentTypes.find((ct) => ct.sys.id === suggestedContentTypeId);
  const buttonText =
    text ||
    `Add ${get(
      suggestedContentType || (contentTypes.length === 1 ? contentTypes[0] : {}),
      'name',
      'entry'
    )}`;
  return (
    <CreateEntryMenuTrigger
      contentTypes={contentTypes}
      suggestedContentTypeId={suggestedContentTypeId}
      onSelect={onSelect}
      testId={testId}
      dropdownSettings={{
        isAutoalignmentEnabled: true,
        position: 'bottom-left',
      }}>
      {({ openMenu }) => (
        <Button
          key="button"
          buttonType="primary"
          onClick={openMenu}
          testId="create-entry-button"
          indicateDropdown={contentTypes.length > 1}
          disabled={disabled || (contentTypes && contentTypes.length === 0)}
          className={styles.createEntryButton}>
          {buttonText}
        </Button>
      )}
    </CreateEntryMenuTrigger>
  );
};

CreateEntryButton.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  suggestedContentTypeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  text: PropTypes.string,
  testId: PropTypes.string,
};

CreateEntryButton.defaultProps = {
  disabled: false,
};

export default CreateEntryButton;