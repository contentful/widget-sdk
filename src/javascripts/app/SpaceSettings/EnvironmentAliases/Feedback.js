import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import FeedbackButton from 'app/common/FeedbackButton';

const feedbackModalStyles = {
  box: css({
    width: '100%',
    zIndex: 0,
    height: tokens.spacing2Xl,
    marginBottom: tokens.spacingM,
    position: 'relative',
    '& > svg': {
      width: '100%',
      height: '100%',
      fill: 'transparent',
      stroke: tokens.colorTextLightest
    },
    '& > button': {
      position: 'absolute',
      transform: 'translate(-50%, -60%)',
      left: '50%',
      top: '50%'
    }
  })
};

export default function Feedback() {
  return (
    <div className={feedbackModalStyles.box}>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <rect
          height="100%"
          width="100%"
          strokeWidth="1"
          strokeDasharray="5"
          strokeLinecap="square"></rect>
      </svg>
      <FeedbackButton
        target="devWorkflows"
        about="Environment Aliases"
        label="+ Want more aliases?"
      />
    </div>
  );
}
