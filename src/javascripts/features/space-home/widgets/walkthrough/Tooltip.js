import React from 'react';
import PropTypes from 'prop-types';
import { snakeCase } from 'lodash';
import { track } from 'analytics/Analytics';
import { Button, IconButton, Subheading } from '@contentful/forma-36-react-components';
import { getCurrentStateName } from 'states/Navigator';
import { styles } from './styles';

const trackingGroupId = 'author_editor_continuous_onboarding';

// Props for this component come from ReactJoyride
// Docs on ReactJoyride's castom tooltip components:
// https://docs.react-joyride.com/custom-components#tooltipcomponent

export const Tooltip = ({ isLastStep, index, step, primaryProps, tooltipProps, closeProps }) => {
  const primaryButtonLabel = isLastStep ? 'Get started' : 'Got it';
  const currentStateName = getCurrentStateName();
  return (
    <div
      className={styles.walkthroughTooltip}
      key={index}
      {...tooltipProps}
      data-test-id={`walkthrough-step-tooltip-${index + 1}`}>
      <div className={styles.tooltipHeader}>
        <Subheading className={styles.tooltipHeading} element="h3">
          {step.title}
        </Subheading>
        <IconButton
          {...closeProps}
          label="Close tour step tooltip"
          iconProps={{ icon: 'Close' }}
          buttonType="white"
          onClick={(e) => {
            closeProps.onClick(e);
            track('element:click', {
              elementId: `close_walkthrough_step_${snakeCase(step.title)}`,
              groupId: trackingGroupId,
              fromState: currentStateName,
            });
          }}
          testId="close-walkthrough-tooltip-button"
        />
      </div>
      {step.content}
      <div className={styles.tooltipButtonContainer}>
        <Button
          {...primaryProps}
          aria-label={primaryButtonLabel}
          isFullWidth
          buttonType="positive"
          onClick={(e) => {
            primaryProps.onClick(e);
            track('element:click', {
              elementId: `finish_walkthrough_step_${snakeCase(step.title)}`,
              groupId: trackingGroupId,
              fromState: currentStateName,
            });
          }}
          testId="next-step-walkthrough-tooltip-button">
          {primaryButtonLabel}
        </Button>
      </div>
    </div>
  );
};

Tooltip.propTypes = {
  isLastStep: PropTypes.bool,
  index: PropTypes.number,
  step: PropTypes.any,
  primaryProps: PropTypes.any,
  tooltipProps: PropTypes.any,
  closeProps: PropTypes.any,
};