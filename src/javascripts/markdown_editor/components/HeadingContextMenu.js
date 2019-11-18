import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Tooltip,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';

const HeadingContextMenu = ({ actions, isDisabled = false, isZenMode = false }) => {
  const [isOpen, setOpen] = useState(false);
  if (!actions) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <Tooltip place={isZenMode ? 'bottom' : 'top'} content="Headings">
          <Button
            size="small"
            buttonType="naked"
            indicateDropdown
            onClick={() => setOpen(!isOpen)}
            disabled={isDisabled}>
            H
          </Button>
        </Tooltip>
      }>
      <DropdownList>
        <DropdownListItem onClick={actions.h1}>Heading 1</DropdownListItem>
        <DropdownListItem onClick={actions.h2}>Heading 2</DropdownListItem>
        <DropdownListItem onClick={actions.h3}>Heading 3</DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
};

HeadingContextMenu.propTypes = {
  actions: PropTypes.shape({
    h1: PropTypes.func.isRequired,
    h2: PropTypes.func.isRequired,
    h3: PropTypes.func.isRequired
  }),
  isDisabled: PropTypes.bool.isRequired,
  isZenMode: PropTypes.bool.isRequired
};

export default HeadingContextMenu;
