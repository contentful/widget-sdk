import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
} from '@contentful/forma-36-react-components';

const DropdownContainer = ({ id, handleEntityDelete, entity }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isDropdownOpen}
      position="bottom-right"
      onClose={() => setIsDropdownOpen(false)}
      toggleElement={
        <Button
          buttonType="naked"
          data-test-id={`${id}_remove-release-ddl`}
          icon="MoreHorizontal"
          onClick={(event) => {
            event.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
        />
      }>
      <DropdownList>
        <DropdownListItem
          testId="delete-entity"
          onClick={(event) => {
            handleEntityDelete(entity);
            setIsDropdownOpen(false);
            event.stopPropagation();
          }}>
          Remove from release
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
};

DropdownContainer.propTypes = {
  id: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
};

export default DropdownContainer;
