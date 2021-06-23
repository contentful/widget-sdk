import React from 'react';
import { css } from 'emotion';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  SkeletonRow,
  TextLink,
} from '@contentful/forma-36-react-components';
import { RouteLink } from 'core/react-routing';
import { track } from 'analytics/Analytics';
import type { SpacePlan } from '../types';

const styles = {
  nameCol: css({
    width: '30%',
  }),
};

interface UnassignedPlansTableProps {
  organizationId: string;
  plans: SpacePlan[];
  initialLoad?: boolean;
}
export function UnassignedPlansTable({
  organizationId,
  plans,
  initialLoad,
}: UnassignedPlansTableProps) {
  return (
    <Table testId="subscription-page.unassigned-plans-table">
      <colgroup>
        <col className={styles.nameCol} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell>Space type</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {initialLoad ? (
          <SkeletonRow columnCount={1} rowCount={10} />
        ) : (
          plans.map((plan) => {
            return (
              <TableRow
                testId="subscription-page.spaces-list.unassigned-plans-table-row"
                key={plan.sys.id || (plan.space && plan.space.sys.id)}>
                <TableCell>
                  <strong>{plan.name}</strong>&nbsp;
                  <>
                    -{' '}
                    <RouteLink
                      testId="subscription-page.spaces-list.create-with-plan"
                      as={TextLink}
                      route={{
                        path: 'organizations.subscription.overview.create-space',
                        planId: plan.sys.id,
                        orgId: organizationId,
                      }}
                      onClick={() => {
                        track('space_creation:begin', {
                          plan_id: plan.sys.id,
                          flow: 'space_creation_for_plan',
                        });
                      }}>
                      new space
                    </RouteLink>
                  </>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
