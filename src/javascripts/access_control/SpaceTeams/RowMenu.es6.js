import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import useClickOutside from 'app/common/hooks/useClickOutside.es6';

const RowMenu = ({ isOpen, setOpen, setEditing }) => {
  const ref = useRef();
  useClickOutside(ref, isOpen, () => setOpen(false));

  return (
    <Dropdown
      isOpen={isOpen}
      toggleElement={
        <IconButton
          testId={'action-button'}
          label="Action"
          buttonType="secondary"
          iconProps={{ icon: 'MoreHorizontal' }}
          onClick={() => setOpen(!isOpen)}
        />
      }>
      <div ref={ref}>
        <DropdownList>
          <DropdownListItem onClick={() => setEditing(true) || setOpen(false)}>
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
  setEditing: PropTypes.func.isRequired
};

export default RowMenu;
