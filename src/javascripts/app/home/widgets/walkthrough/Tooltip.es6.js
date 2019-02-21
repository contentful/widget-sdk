import React from 'react';
import PropTypes from 'prop-types';
import { snakeCase } from 'lodash';
import { getModule } from 'NgRegistry.es6';
import { track } from 'analytics/Analytics.es6';
import { Button, IconButton, Subheading } from '@contentful/forma-36-react-components';

const $state = getModule('$state');
const trackingGroupId = 'author_editor_continuous_onboarding';

// Props for this component come from ReactJoyride
// Docs on ReactJoyride's castom tooltip components:
// https://docs.react-joyride.com/custom-components#tooltipcomponent

const Tooltip = ({ isLastStep, index, step, primaryProps, tooltipProps, closeProps }) => {
  return (
    <div
      className="walkthrough-tooltip"
      key={index}
      {...tooltipProps}
      data-test-id={`walkthrough-step-tooltip-${index + 1}`}>
      <div className="walkthrough-tooltip__header">
        <Subheading extraClassNames="walkthrough-tooltip__heading" element="h3">
          {step.title}
        </Subheading>
        <IconButton
          {...closeProps}
          label="Close tour step tooltip"
          iconProps={{ icon: 'Close' }}
          buttonType="white"
          onClick={e => {
            closeProps.onClick(e);
            track('element:click', {
              elementId: `close_walkthrough_step_${snakeCase(step.title)}`,
              groupId: trackingGroupId,
              fromState: $state.current.name
            });
          }}
          testId="close-walkthrough-tooltip-button"
        />
      </div>
      {step.content}
      <div className="walkthrough-tooltip__button-container">
        <Button
          {...primaryProps}
          isFullWidth
          buttonType="positive"
          onClick={e => {
            primaryProps.onClick(e);
            track('element:click', {
              elementId: `finish_walkthrough_step_${snakeCase(step.title)}`,
              groupId: trackingGroupId,
              fromState: $state.current.name
            });
          }}
          testId="next-step-walkthrough-tooltip-button">
          {isLastStep ? 'Get started' : 'Got it'}
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
  closeProps: PropTypes.any
};

export default Tooltip;
