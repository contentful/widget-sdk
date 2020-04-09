import {
  SkeletonBodyText,
  SkeletonContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@contentful/forma-36-react-components';
import React, { useCallback, useMemo } from 'react';
import TagsListRow from './TagsListRow';
import PropTypes from 'prop-types';
import { isEdge } from 'utils/browser';
import classnames from 'classnames';
import { css } from 'emotion';
import UpdateTagModal from './UpdateTagModal';
import useF36Modal from '../hooks/useF36Modal';
import DeleteTagModal from './DeleteTagModal';
import tagPropType from '../tagPropType';

const isEdgeBrowser = isEdge();

const styles = {
  wideCell: css({
    width: '30%',
  }),
};

function TagsList({ tags, isLoading }) {
  const { modalComponent: deleteTagComponent, showModal: showDeleteModal } = useF36Modal(
    DeleteTagModal
  );
  const { modalComponent: updateTagComponent, showModal: showUpdateModal } = useF36Modal(
    UpdateTagModal
  );

  const onDelete = useCallback((tag) => showDeleteModal({ tag }), [showDeleteModal]);
  const onEdit = useCallback((tag) => showUpdateModal({ tag }), [showUpdateModal]);

  const renderNoTags = useMemo(() => {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <SkeletonContainer
            svgWidth="100%"
            svgHeight={170}
            ariaLabel="Loading tags"
            clipId="loading-tags">
            <SkeletonBodyText numberOfLines={5} offsetLeft={0} marginBottom={15} offsetTop={20} />
          </SkeletonContainer>
        </TableCell>
      </TableRow>
    );
  }, []);

  const renderTags = useMemo(() => {
    return tags.map((tag, index) => {
      return <TagsListRow key={`tag-row-${index}`} onDelete={onDelete} onEdit={onEdit} {...tag} />;
    });
  }, [tags, onDelete, onEdit]);

  return (
    <>
      {updateTagComponent}
      {deleteTagComponent}
      <Table
        testId="tags-list-table"
        className={classnames({
          'organization-membership-list--loading': isLoading,
        })}>
        <TableHead offsetTop={isEdgeBrowser ? '0px' : '-1.8em'} isSticky>
          <TableRow>
            <TableCell className={styles.wideCell}>Tag name</TableCell>
            <TableCell className={styles.wideCell}>Tag ID</TableCell>
            <TableCell>Entries tagged</TableCell>
            <TableCell>Assets tagged</TableCell>
            <TableCell>Date added</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>{tags.length > 0 ? renderTags : renderNoTags}</TableBody>
      </Table>
    </>
  );
}

TagsList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.shape(tagPropType)),
  isLoading: PropTypes.bool,
};

export default TagsList;
