import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get, isEmpty } from 'lodash';
import { isEdge } from 'utils/browser';
const isEdgeBrowser = isEdge();
import StateLink from 'app/common/StateLink';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tag
} from '@contentful/forma-36-react-components';

import FetchAndFormatUserName from 'components/shared/UserNameFormatter/FetchAndFormatUserName';
import RelativeDateTime from 'components/shared/RelativeDateTime/index';
import { isPublishedAndUpdated, isPublished } from '../ContentTypeListService';

const numFields = ct => (ct.fields || []).length;

const statusType = ct => getStatusType(ct);
const statusLabel = ct => {
  const label = getStatusLabel(ct);
  // Historically we call published content types "active".
  return label === 'published' ? 'active' : label;
};

// TODO extract the following methods.
// There is already `EntityStatus` but it
// operates on legacy CMA client entities.
function getStatusLabel(ct) {
  if (isPublishedAndUpdated(ct)) {
    return 'updated';
  } else if (isPublished(ct)) {
    return 'published';
  } else {
    return 'draft';
  }
}

function getStatusType(ct) {
  let statusType;

  if (isPublishedAndUpdated(ct)) {
    statusType = 'primary';
  } else if (isPublished(ct)) {
    statusType = 'positive';
  } else {
    statusType = 'warning';
  }

  return statusType;
}

class ContentTypeList extends Component {
  static propTypes = {
    contentTypes: PropTypes.array.isRequired
  };

  render() {
    return (
      <Table>
        <TableHead offsetTop={isEdgeBrowser ? '0px' : '-22px'} isSticky>
          <TableRow>
            <TableCell className="x--medium-cell" aria-label="Name">
              Name
            </TableCell>
            <TableCell className="x--large-cell" arial-label="Description">
              Description
            </TableCell>
            <TableCell className="x--small-cell" aria-label="Fields">
              Fields
            </TableCell>
            <TableCell className="x--small-cell" aria-label="Updated">
              Updated
            </TableCell>
            <TableCell className="x--small-cell" aria-label="By">
              By
            </TableCell>
            <TableCell className="x--small-cell" aria-label="Status">
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.contentTypes.map(contentType => {
            return (
              <StateLink
                to="^.detail.fields"
                params={{ contentTypeId: contentType.sys.id }}
                key={contentType.sys.id}>
                {({ onClick }) => {
                  return (
                    <TableRow
                      className="ctf-ui-cursor--pointer"
                      data-test-id="content-type-item"
                      onClick={onClick}>
                      <TableCell className="x--medium-cell" data-test-id="cell-name">
                        {isEmpty(contentType.name) ? 'Untitled' : contentType.name}
                      </TableCell>
                      <TableCell className="x--large-cell" data-test-id="cell-description">
                        {contentType.description}
                      </TableCell>
                      <TableCell className="x--small-cell" data-test-id="cell-fields">
                        {numFields(contentType)}
                      </TableCell>
                      <TableCell className="x--small-cell" data-test-id="cell-date">
                        {contentType.sys.updatedAt ? (
                          <RelativeDateTime value={contentType.sys.updatedAt} />
                        ) : null}
                      </TableCell>
                      <TableCell className="x--small-cell" data-test-id="cell-created-by">
                        <FetchAndFormatUserName
                          userId={get(contentType, ['sys', 'publishedBy', 'sys', 'id'], '')}
                        />
                      </TableCell>
                      <TableCell className="x--small-cell" data-test-id="cell-status">
                        <Tag tagType={statusType(contentType)}>{statusLabel(contentType)}</Tag>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </StateLink>
            );
          })}
        </TableBody>
      </Table>
    );
  }
}

export default ContentTypeList;
