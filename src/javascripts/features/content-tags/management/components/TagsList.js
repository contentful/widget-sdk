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
import PropTypes from 'prop-types';
import { isEdge } from 'utils/browser';
import classnames from 'classnames';
import { css } from 'emotion';
import { TagsListRow } from 'features/content-tags/management/components/TagsListRow';
import { UpdateTagModal } from 'features/content-tags/management/components/UpdateTagModal';
import { DeleteTagModal } from 'features/content-tags/management/components/DeleteTagModal';
import { useContentLevelPermissions, useF36Modal } from 'features/content-tags/core/hooks';
import { TagPropType } from 'features/content-tags/core/TagPropType';
import tokens from '@contentful/forma-36-tokens';

const isEdgeBrowser = isEdge();

const styles = {
  wideCell: css({
    width: '35%',
  }),
  tableHead: css({
    th: {
      zIndex: tokens.zIndexDefault,
    },
  }),
  flexContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingL,
  }),
};

function TagsList({ tags, isLoading }) {
  const { modalComponent: deleteTagComponent, showModal: showDeleteModal } = useF36Modal(
    DeleteTagModal
  );
  const { modalComponent: updateTagComponent, showModal: showUpdateModal } = useF36Modal(
    UpdateTagModal
  );

  const { contentLevelPermissionsEnabled } = useContentLevelPermissions();

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
      return (
        <TagsListRow
          key={`tag-row-${index}`}
          contentLevelPermissionsEnabled={contentLevelPermissionsEnabled}
          onDelete={onDelete}
          onEdit={onEdit}
          tag={tag}
        />
      );
    });
  }, [tags, onDelete, onEdit, contentLevelPermissionsEnabled]);

  return (
    <>
      {updateTagComponent}
      {deleteTagComponent}
      <Table
        testId="tags-list-table"
        className={classnames({
          'organization-membership-list--loading': isLoading,
        })}>
        <TableHead
          className={styles.tableHead}
          offsetTop={isEdgeBrowser ? '0px' : '-1.8em'}
          isSticky>
          <TableRow>
            <TableCell className={styles.wideCell}>Tag name</TableCell>
            {contentLevelPermissionsEnabled && <TableCell>Type</TableCell>}
            <TableCell className={styles.wideCell}>Tag ID</TableCell>
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
  tags: PropTypes.arrayOf(PropTypes.shape(TagPropType)),
  isLoading: PropTypes.bool,
};

export { TagsList };
