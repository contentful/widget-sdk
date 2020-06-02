import {
  CardActions,
  CopyButton,
  DropdownList,
  DropdownListItem,
  TableCell,
  TableRow,
} from '@contentful/forma-36-react-components';
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { TagPropType } from 'features/content-tags/core/TagPropType';

const styles = {
  delete: css({
    color: tokens.colorRedBase,
  }),
  longText: css({
    wordBreak: 'break-word', //break-word,
    overflowWrap: 'break-word',
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
  return (
    <CardActions>
      <DropdownList>
        <DropdownListItem testId="tag-menu-edit" onClick={props.onEdit}>
          Rename tag
        </DropdownListItem>
        <DropdownListItem testId="tag-menu-delete" onClick={props.onDelete}>
          <span className={styles.delete}>Delete tag</span>
        </DropdownListItem>
      </DropdownList>
    </CardActions>
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
      <TableCell className={styles.longText}>{name}</TableCell>
      <TableCell className={styles.longText}>
        <code>{id}</code>
        <CopyButton className={styles.copy} copyValue={id} testId="id.copy" />
      </TableCell>
      <TableCell>
        <RelativeDateTime value={createdAt} />
      </TableCell>
      <TableCell align={'right'}>{actions}</TableCell>
    </TableRow>
  );
}

TagsListRow.propTypes = TagPropType;

export { TagsListRow };