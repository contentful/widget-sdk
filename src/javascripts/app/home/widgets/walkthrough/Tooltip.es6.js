import React from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton, Heading } from '@contentful/forma-36-react-components';

// Props for this component come from ReactJoyride
// Docs on ReactJoyride's castom tooltip components:
// https://docs.react-joyride.com/custom-components#tooltipcomponent

const Tooltip = ({ isLastStep, index, step, primaryProps, tooltipProps, closeProps }) => {
  return (
    <div
      className="walkthrough-tooltip"
      key={index}
      {...tooltipProps}
      data-test-id="walkthrough-step-tooltip">
      <div className="walkthrough-tooltip__header">
        <Heading className="walkthrough-tooltip__heading" element="h3">
          {step.title}
        </Heading>
        <IconButton
          {...closeProps}
          label="Close tour step tooltip"
          iconProps={{ icon: 'Close' }}
          buttonType="white"
          onClick={e => {
            closeProps.onClick(e);
          }}
          testId="close-walkthrough-tooltip-button"
        />
      </div>
      {step.content && { ...step.content }}
      <div className="walkthrough-tooltip__button-container">
        <Button
          {...primaryProps}
          isFullWidth
          buttonType="positive"
          onClick={e => {
            primaryProps.onClick(e);
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
