import React from 'react';
import { get, isEmpty } from 'lodash';
import { isEdge } from 'utils/browser';
import SecretiveLink from 'components/shared/SecretiveLink';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tag,
} from '@contentful/forma-36-react-components';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { isPublished, isPublishedAndUpdated } from './ContentTypeListService';
import type { ContentType } from 'core/services/SpaceEnvContext/types';
import { RouteLink } from 'core/react-routing';

const isEdgeBrowser = isEdge();

const numFields = (ct) => (ct.fields || []).length;

const statusType = (ct) => getStatusType(ct);
const statusLabel = (ct) => {
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

export function ContentTypeList({ contentTypes }: { contentTypes: ContentType[] }) {
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
        {contentTypes.map((contentType) => {
          return (
            <RouteLink
              route={{ path: 'content_types.detail', contentTypeId: contentType.sys.id }}
              key={contentType.sys.id}
              handlePrevented>
              {({ onClick, getHref }) => {
                return (
                  <TableRow
                    className="ctf-ui-cursor--pointer"
                    data-test-id="content-type-item"
                    data-content-type-name={contentType.name}
                    onClick={onClick}>
                    <TableCell className="x--medium-cell" data-test-id="cell-name">
                      <SecretiveLink href={getHref()}>
                        {isEmpty(contentType.name) ? 'Untitled' : contentType.name}
                      </SecretiveLink>
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
                      <ActionPerformerName
                        link={get(contentType, ['sys', 'updatedBy'], {
                          sys: {
                            linkType: 'User',
                            id: '',
                            type: 'Link',
                          },
                        })}
                      />
                    </TableCell>
                    <TableCell className="x--small-cell" data-test-id="cell-status">
                      <Tag tagType={statusType(contentType)}>{statusLabel(contentType)}</Tag>
                    </TableCell>
                  </TableRow>
                );
              }}
            </RouteLink>
          );
        })}
      </TableBody>
    </Table>
  );
}
