import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import useClickOutside from 'app/common/hooks/useClickOutside.es6';

const RowMenu = ({ isOpen, setOpen, setEditing, disabled }) => {
  const ref = useRef();
  useClickOutside(ref, isOpen, () => setOpen(false));

  return (
    <Dropdown
      testId="row-menu"
      isOpen={isOpen}
      toggleElement={
        <IconButton
          disabled={disabled}
          testId={'action-button'}
          label="Action"
          buttonType="primary"
          iconProps={{ icon: 'MoreHorizontal' }}
          onClick={() => setOpen(!isOpen)}
        />
      }>
      <div ref={ref}>
        <DropdownList>
          <DropdownListItem testId="change-role" onClick={() => setEditing(true) || setOpen(false)}>
            Change team role
          </DropdownListItem>
        </DropdownList>
      </div>
    </Dropdown>
  );
};

RowMenu.propTypes = {
  setOpen: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setEditing: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default RowMenu;
