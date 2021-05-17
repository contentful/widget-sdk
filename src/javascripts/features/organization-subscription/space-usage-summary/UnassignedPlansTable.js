import React from 'react';
import PropTypes from 'prop-types';
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

const styles = {
  nameCol: css({
    width: '30%',
  }),
};

export function UnassignedPlansTable({
  organizationId,
  plans,
  initialLoad,
  spaceAssignmentExperiment,
  canCreateSpaceWithPlan,
}) {
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
                  {spaceAssignmentExperiment && (
                    <>
                      -{' '}
                      <RouteLink
                        as={TextLink}
                        testId="subscription-page.spaces-list.change-plan-link"
                        route={{
                          path: 'organizations.subscription.overview.space-plans',
                          planId: plan.sys.id,
                          orgId: organizationId,
                        }}
                        onClick={() => {
                          track('space_assignment:change', {
                            plan_id: plan.sys.id,
                            flow: 'assign_space_to_plan',
                          });
                        }}>
                        use space
                      </RouteLink>
                    </>
                  )}
                  {canCreateSpaceWithPlan && (
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
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

UnassignedPlansTable.propTypes = {
  organizationId: PropTypes.string.isRequired,
  plans: PropTypes.array.isRequired,
  initialLoad: PropTypes.bool,
  spaceAssignmentExperiment: PropTypes.bool,
  canCreateSpaceWithPlan: PropTypes.bool,
};
