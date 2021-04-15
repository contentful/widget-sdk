import React from 'react';
import { Flex, Button, TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import { CREATION_FLOW_TYPE } from 'features/space-creation';
import { FlowType } from '../types';
import { BasePlan } from 'features/pricing-entities';

interface WizardFixedFooterProps {
  spaceId: string;
  selectedPlan: BasePlan;
  continueBtnDisabled: boolean;
  onNext: () => boolean;
  flowType: FlowType;
  handleGetInTouchClick?: () => void;
}

const styles = {
  stickyBar: css({
    position: 'fixed',
    bottom: 0,
    left: 0,
    backgroundColor: tokens.colorWhite,
    borderTop: `1px solid ${tokens.colorElementMid}`,
    '& > div': { maxWidth: '1280px' },
  }),
};

const WizardFixedFooter = ({
  spaceId,
  continueBtnDisabled,
  onNext,
  flowType,
  handleGetInTouchClick,
}: WizardFixedFooterProps) => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      paddingTop="spacingL"
      paddingBottom="spacingL"
      fullWidth
      className={styles.stickyBar}>
      <Flex justifyContent="space-between" alignItems="center" fullWidth>
        {flowType === CREATION_FLOW_TYPE && (
          <Flex fullWidth>
            <TextLink onClick={handleGetInTouchClick}>
              Get in touch if you need something more
            </TextLink>
          </Flex>
        )}

        <Flex flexDirection="row" justifyContent="flex-end" alignItems="center" fullWidth>
          <StateLink
            component={Button}
            path={'^'}
            trackingEvent={
              flowType === CREATION_FLOW_TYPE ? 'space_creation:back' : 'space_assignment:back'
            }
            trackParams={{
              // eslint-disable-next-line @typescript-eslint/camelcase
              space_id: spaceId,
              flow: flowType === CREATION_FLOW_TYPE ? 'space_creation' : 'assign_plan_to_space',
            }}>
            {({ onClick }) => (
              <Button buttonType="muted" testId="go-back-btn" onClick={onClick}>
                Cancel
              </Button>
            )}
          </StateLink>
          <Flex marginLeft="spacingM">
            <Button
              buttonType="primary"
              onClick={onNext}
              testId="continue-btn"
              disabled={continueBtnDisabled}>
              Continue
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export { WizardFixedFooter };
