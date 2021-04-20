import React from 'react';
import { CardActions, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';

type RowMenuProps = {
  setEditing: (value: boolean) => void;
  onRemove: () => void;
};

const RowMenu = ({ setEditing, onRemove }: RowMenuProps) => (
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

export { RowMenu };
