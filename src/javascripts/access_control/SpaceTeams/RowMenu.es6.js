import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import useClickOutside from 'app/common/hooks/useClickOutside.es6';

const RowMenu = ({ membershipId, isOpen, setOpen }) => {
  const ref = useRef();
  useClickOutside(ref, isOpen, () => setOpen(false));

  return (
    <Dropdown
      isOpen={isOpen}
      toggleElement={
        <IconButton
          testId={`action-button-${membershipId}`}
          label="Action"
          buttonType="secondary"
          iconProps={{ icon: 'MoreHorizontal' }}
          onClick={() => setOpen(!isOpen)}
        />
      }>
      <div ref={ref}>
        <DropdownList>
          <DropdownListItem onClick={() => alert('Wow, so much edit!')}>
            Change team role
          </DropdownListItem>
        </DropdownList>
      </div>
    </Dropdown>
  );
};

RowMenu.propTypes = {
  membershipId: PropTypes.string.isRequired,
  setOpen: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default RowMenu;
