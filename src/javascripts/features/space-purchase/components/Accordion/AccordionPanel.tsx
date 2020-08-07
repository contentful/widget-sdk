import React, { FC } from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  accordionPanel: css({
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: `0 ${tokens.spacingM}`,
    height: 0,
  }),
  expanded: css({
    padding: `0 ${tokens.spacingM} ${tokens.spacingM}`,
    height: 'auto',
  }),
};

interface AccordionPanelProps {
  children?: React.ReactNode;
  ariaId?: number;
  isOpen: boolean;
}

const defaultProps: AccordionPanelProps = {
  isOpen: false,
};

export const AccordionPanel: FC<AccordionPanelProps> = ({
  children,
  isOpen,
  ariaId,
}: AccordionPanelProps) => {
  return (
    <div
      id={`accordion-panel--${ariaId}`}
      role="region"
      aria-labelledby={`accordion--${ariaId}`}
      className={cn(styles.accordionPanel, {
        [styles.expanded]: isOpen,
      })}>
      {children}
    </div>
  );
};
AccordionPanel.defaultProps = defaultProps;
