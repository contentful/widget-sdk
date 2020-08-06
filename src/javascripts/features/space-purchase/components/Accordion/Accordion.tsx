import React from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  accordion: css({
    boxSizing: 'border-box',
    padding: 0,
    margin: 0,
    listStyle: 'none',
    '& li': {
      padding: 0,
      margin: 0,
      borderBottom: `1px solid ${tokens.colorElementMid}`,

      '&:first-child': {
        borderTop: `1px solid ${tokens.colorElementMid}`,
      },
    },
  }),
  accordionStart: css({
    '& svg': {
      minWidth: '9px' /* necessary to algin the chevron properly */,
      marginRight: tokens.spacingXs,
    },
  }),
  accordionEnd: css({
    '& button': {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
    },
  }),
};

type AlignTypes = 'start' | 'end';

export interface AccordionProps {
  /**
   * Class names to be appended to the className prop of the Accordion wrapper
   */
  className?: string;
  /**
   * Child nodes to be rendered in the component
   */
  children?: React.ReactNode;
  /**
   * An ID used for testing purposes applied as a data attribute (data-test-id)
   */
  testId?: string;
  /**
   * Specify the alignment of the chevron inside the accordion header
   */
  align?: AlignTypes;
}

const defaultProps = {
  align: 'end',
  testId: 'cf-ui-accordion',
};

export const Accordion = ({
  align,
  children,
  className,
  testId,
  ...otherProps
}: AccordionProps) => {
  const classNames = cn(styles.accordion, className, {
    [styles.accordionStart]: align === 'start',
    [styles.accordionEnd]: align === 'end',
  });

  return (
    <ul className={classNames} data-test-id={testId} {...otherProps}>
      {children}
    </ul>
  );
};
Accordion.defaultProps = defaultProps;
