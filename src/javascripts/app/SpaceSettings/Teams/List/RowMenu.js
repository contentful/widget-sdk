import React from 'react';
import PropTypes from 'prop-types';
import { CardActions, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';

const RowMenu = ({ setEditing, onRemove }) => (
  <CardActions testId="row-menu" iconButtonProps={{ buttonType: 'primary' }}>
    <DropdownList>
      <DropdownListItem testId="change-role" onClick={() => setEditing(true)}>
        Change team role
      </DropdownListItem>
      <DropdownListItem testId="remove-team" onClick={onRemove}>
        Remove team from space
      </DropdownListItem>
    </DropdownList>
  </CardActions>
);

RowMenu.propTypes = {
  setEditing: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default RowMenu;
