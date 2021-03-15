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
import StateLink from 'app/common/StateLink';

const styles = {
  nameCol: css({
    width: '30%',
  }),
};

export function UnassignedPlansTable({
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
                      <StateLink
                        testId="subscription-page.spaces-list.change-plan-link"
                        component={TextLink}
                        path=".space_plans"
                        params={{ planId: plan.sys.id }}
                        trackingEvent={'space_assignment:change'}
                        trackParams={{
                          plan_id: plan.sys.id,
                          flow: 'assign_space_to_plan',
                        }}>
                        use space
                      </StateLink>
                    </>
                  )}
                  {canCreateSpaceWithPlan && (
                    <>
                      -{' '}
                      <StateLink
                        testId="subscription-page.spaces-list.create-with-plan"
                        component={TextLink}
                        path=".space_create"
                        params={{ planId: plan.sys.id }}
                        trackingEvent={'space_creation:begin'}
                        trackParams={{
                          plan_id: plan.sys.id,
                          flow: 'space_creation_for_plan',
                        }}>
                        new space
                      </StateLink>
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
  plans: PropTypes.array.isRequired,
  initialLoad: PropTypes.bool,
  spaceAssignmentExperiment: PropTypes.bool,
  canCreateSpaceWithPlan: PropTypes.bool,
};
