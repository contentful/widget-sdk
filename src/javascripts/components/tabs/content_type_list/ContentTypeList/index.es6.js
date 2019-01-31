import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEdge } from 'app/widgets/rich_text/helpers/browser.es6';
import StateLink from 'app/common/StateLink.es6';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tag
} from '@contentful/forma-36-react-components';

import FetchAndFormatUserName from 'components/shared/UserNameFormatter/FetchAndFormatUserName.es6';
import RelativeDateTime from 'components/shared/RelativeDateTime/index.es6';

const numFields = ct => (ct.fields || []).length;
const isEdgeBrowser = isEdge();

const statusType = ct => getStatusType(ct);
const statusLabel = ct => {
  const label = getStatusLabel(ct);
  // Historically we call published content types "active".
  return label === 'published' ? 'active' : label;
};

// TODO extract the following methods.
// There is already `EntityStatus.es6` but it
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

function isPublished(entity) {
  return !!entity.sys.publishedVersion;
}

function isPublishedAndUpdated(entity) {
  return isPublished(entity) && entity.sys.version > entity.sys.publishedVersion + 1;
}

class ContentTypeList extends Component {
  static propTypes = {
    contentTypes: PropTypes.array.isRequired
  };

  render() {
    return (
      <Table>
        <TableHead offsetTop={isEdgeBrowser ? '0px' : '-20px'} isSticky>
          <TableRow>
            <TableCell extraClassNames="x--medium-cell" aria-label="Name">
              Name
            </TableCell>
            <TableCell extraClassNames="x--large-cell" arial-label="Description">
              Description
            </TableCell>
            <TableCell extraClassNames="x--small-cell" aria-label="Fields">
              Fields
            </TableCell>
            <TableCell extraClassNames="x--small-cell" aria-label="Updated">
              Updated
            </TableCell>
            <TableCell extraClassNames="x--small-cell" aria-label="By">
              By
            </TableCell>
            <TableCell extraClassNames="x--small-cell" aria-label="Status">
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
                      extraClassNames="ctf-ui-cursor--pointer"
                      data-test-id="content-type-item"
                      onClick={onClick}>
                      <TableCell extraClassNames="x--medium-cell" data-test-id="cell-name">
                        {contentType.name}
                      </TableCell>
                      <TableCell extraClassNames="x--large-cell" data-test-id="cell-description">
                        {contentType.description}
                      </TableCell>
                      <TableCell extraClassNames="x--small-cell" data-test-id="cell-fields">
                        {numFields(contentType)}
                      </TableCell>
                      <TableCell extraClassNames="x--small-cell" data-test-id="cell-date">
                        <RelativeDateTime value={contentType.sys.updatedAt} />
                      </TableCell>
                      <TableCell extraClassNames="x--small-cell" data-test-id="cell-created-by">
                        <FetchAndFormatUserName userId={contentType.sys.publishedBy.sys.id} />
                      </TableCell>
                      <TableCell extraClassNames="x--small-cell" data-test-id="cell-status">
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
