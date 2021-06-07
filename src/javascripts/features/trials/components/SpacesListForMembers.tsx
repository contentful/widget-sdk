import React from 'react';
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
import { router } from 'core/react-routing';

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

interface SpacesListForMembersProps {
  spaces: any[];
}

export const SpacesListForMembers = ({ spaces }: SpacesListForMembersProps) => {
  const onViewSpace = (spaceId: string) =>
    router.navigate({ path: 'spaces.detail.home', spaceId }, { reload: true });

  return (
    <>
      <Heading className="section-title" testId="subscription-page-trial-members.heading">
        Spaces
      </Heading>
      {spaces.length > 0 ? (
        <Table testId="subscription-page-trial-members.table">
          <colgroup>
            <col className={styles.nameCol} />
            <col />
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
