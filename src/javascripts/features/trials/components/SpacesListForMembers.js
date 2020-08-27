import React from 'react';
import PropTypes, { object } from 'prop-types';
import moment from 'moment';
import {
  Heading,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  DropdownListItem,
  DropdownList,
  CardActions,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { go } from 'states/Navigator';

const styles = {
  nameCol: css({
    width: '30%',
  }),
  typeCol: css({
    width: '30%',
  }),
  actionsCol: css({
    width: '60px',
  }),
  moreButton: css({
    verticalAlign: 'middle',
  }),
};

export const SpacesListForMembers = ({ spaces }) => {
  const onViewSpace = (id) =>
    go({
      path: ['spaces', 'detail', 'home'],
      params: { spaceId: id },
      options: { reload: true },
    });

  return (
    <>
      <Heading className="section-title" testId="subscription-page-trial-members.heading">
        Spaces
      </Heading>
      {spaces.length > 0 ? (
        <Table testId="subscription-page-trial-members.table">
          <colgroup>
            <col className={styles.nameCol} />
            <col className={styles.createdOnCol} />
            <col className={styles.actionsCol} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell testId="subscription-page-trial-members.table-header.name">Name</TableCell>
              <TableCell testId="subscription-page-trial-members.table-header.created-on">
                Created on
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {spaces.map((space) => {
              return (
                <TableRow key={space.sys.id} testId="subscription-page-trial-members.table-row">
                  <TableCell testId="subscription-page-trial-members.table-row.name">
                    {space.name}
                  </TableCell>
                  <TableCell testId="subscription-page-trial-members.table-row.created-on">
                    {moment.utc(space.sys.createdAt).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell className={styles.moreButton}>
                    <CardActions
                      iconButtonProps={{
                        testId: 'subscription-page-trial-members.dropdown-menu.trigger',
                      }}>
                      <DropdownList>
                        <DropdownListItem
                          onClick={() => onViewSpace(space.sys.id)}
                          testId="subscription-page-trial-members.dropdown-menu-item.space-link">
                          Go to space
                        </DropdownListItem>
                      </DropdownList>
                    </CardActions>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Paragraph testId="subscription-page-trial-members.no-spaces-placeholder">
          You are not added to any spaces. To be added to a space, talk to your administrator.
        </Paragraph>
      )}
    </>
  );
};

SpacesListForMembers.propTypes = {
  spaces: PropTypes.arrayOf(object).isRequired,
};
