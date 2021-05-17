import React from 'react';
import { Flex, Button, TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { CREATION_FLOW_TYPE } from 'features/space-creation';
import { FlowType } from '../types';
import { track } from 'analytics/Analytics';

interface WizardFixedFooterProps {
  spaceId: string;
  continueBtnDisabled: boolean;
  onNext: () => boolean;
  onCancel: () => void;
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
  onCancel,
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
          <Button
            testId="go-back-btn"
            buttonType="muted"
            onClick={() => {
              track(
                flowType === CREATION_FLOW_TYPE ? 'space_creation:back' : 'space_assignment:back',
                {
                  space_id: spaceId,
                  flow: flowType === CREATION_FLOW_TYPE ? 'space_creation' : 'assign_plan_to_space',
                }
              );
              onCancel();
            }}>
            Cancel
          </Button>
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
