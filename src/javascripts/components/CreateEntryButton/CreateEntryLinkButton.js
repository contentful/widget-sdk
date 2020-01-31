import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import { Icon, TextLink, Spinner } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import CreateEntryMenuTrigger from './CreateEntryMenuTrigger';

const styles = {
  chevronIcon: css({
    float: 'right',
    marginLeft: tokens.spacingXs,
    marginRight: -tokens.spacing2Xs
  }),
  spinnerMargin: css({
    marginRight: tokens.spacingXs
  })
};

const CreateEntryLinkButton = ({
  contentTypes,
  onSelect,
  text,
  testId,
  hasPlusIcon,
  suggestedContentTypeId,
  disabled
}) => {
  const suggestedContentType = contentTypes.find(ct => ct.sys.id === suggestedContentTypeId);
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
      testId={testId}>
      {({ openMenu, isSelecting }) => (
        <>
          {isSelecting && <Spinner size="small" key="spinner" className={styles.spinnerMargin} />}
          <TextLink
            key="textLink"
            onClick={openMenu}
            disabled={disabled || isSelecting || (contentTypes && contentTypes.length === 0)}
            icon={isSelecting || !hasPlusIcon ? null : 'Plus'}
            testId="create-entry-link-button">
            {buttonText}
            {contentTypes.length > 1 && (
              <Icon
                data-test-id="dropdown-icon"
                icon="ChevronDown"
                color="secondary"
                className={styles.chevronIcon}
              />
            )}
          </TextLink>
        </>
      )}
    </CreateEntryMenuTrigger>
  );
};

CreateEntryLinkButton.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  suggestedContentTypeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  hasPlusIcon: PropTypes.bool,
  text: PropTypes.string,
  testId: PropTypes.string
};

CreateEntryLinkButton.defaultProps = {
  hasPlusIcon: false,
  disabled: false
};

export default CreateEntryLinkButton;
