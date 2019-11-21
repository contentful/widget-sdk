import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { canUploadMultipleAssets } from 'access_control/AccessChecker';

const InsertMediaComponent = ({ actions }) => {
  if (!actions) {
    return null;
  }

  if (canUploadMultipleAssets()) {
    return <MultipleMediaContextMenu actions={actions} />;
  } else {
    return (
      <Button
        testId="markdownEditor.linkExistingAssets"
        size="small"
        buttonType="muted"
        onClick={actions.existingAssets}>
        <i className="fa fa-picture-o"></i> Insert media
      </Button>
    );
  }
};

const MultipleMediaContextMenu = ({ actions }) => {
  const [isOpen, setOpen] = useState(false);
  const handleMenuClick = action => {
    action();
    setOpen(false);
  };
  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <Button
          testId="markdownEditor.insertMediaDropdownTrigger"
          size="small"
          buttonType="muted"
          indicateDropdown
          onClick={() => setOpen(!isOpen)}>
          <i className="fa fa-picture-o"></i> Insert media
        </Button>
      }>
      <DropdownList>
        <DropdownListItem
          testId="markdownEditor.uploadAssetsAndLink"
          onClick={() => handleMenuClick(actions.newAssets)}>
          Add new media and link
        </DropdownListItem>
        <DropdownListItem
          testId="markdownEditor.linkExistingAssets"
          onClick={() => handleMenuClick(actions.existingAssets)}>
          Link existing media
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
};

InsertMediaComponent.propTypes = MultipleMediaContextMenu.propTypes = {
  actions: PropTypes.shape({
    newAssets: PropTypes.func,
    existingAssets: PropTypes.func
  })
};

export default InsertMediaComponent;
