import {
  CopyButton,
  Dropdown,
  DropdownList,
  DropdownListItem,
  IconButton,
  TableCell,
  TableRow,
} from '@contentful/forma-36-react-components';
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import tagPropType from '../tagPropType';

const styles = {
  delete: css({
    color: tokens.colorRedBase,
  }),
  copy: css({
    margin: '0',
    padding: '0',
    button: {
      margin: '0',
      transform: 'translateY(3px)',
      bottom: '0',
      marginLeft: '0.3em',
      backgroundColor: 'transparent',
      border: 'none',
      height: '1.0em',
      width: '2em',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  }),
};

function TagActions(props) {
  const [isOpen, setOpen] = useState(false);
  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <IconButton
          testId="tag-menu"
          onClick={() => {
            setOpen(true);
          }}
          label="Actions"
          iconProps={{
            icon: 'MoreHorizontal',
          }}
        />
      }>
      <DropdownList>
        <DropdownListItem testId="tag-menu-edit" onClick={props.onEdit}>
          Rename tag
        </DropdownListItem>
        <DropdownListItem testId="tag-menu-delete" onClick={props.onDelete}>
          <span className={styles.delete}>Delete tag</span>
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}

TagActions.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function TagsListRow(tag) {
  const {
    name,
    sys: { id, createdAt },
    entriesTagged,
    assetsTagged,
    onEdit,
    onDelete,
  } = tag;

  const editTag = useCallback(async () => {
    await onEdit(tag);
  }, [tag, onEdit]);

  const deleteTag = useCallback(async () => {
    await onDelete(tag);
  }, [tag, onDelete]);

  const actions = useMemo(() => {
    return <TagActions onEdit={editTag} onDelete={deleteTag} />;
  }, [deleteTag, editTag]);

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>
        <code>{id}</code>
        <CopyButton className={styles.copy} copyValue={id} testId="id.copy" />
      </TableCell>
      <TableCell>{entriesTagged || 0}</TableCell>
      <TableCell>{assetsTagged || 0}</TableCell>
      <TableCell>
        <RelativeDateTime value={createdAt} />
      </TableCell>
      <TableCell align={'right'}>{actions}</TableCell>
    </TableRow>
  );
}

TagsListRow.propTypes = {
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  ...tagPropType,
};

export default TagsListRow;
