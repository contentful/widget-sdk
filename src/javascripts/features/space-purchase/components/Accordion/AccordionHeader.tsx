import React, { FC } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Subheading, Icon } from '@contentful/forma-36-react-components';

const styles = {
  accordionHeader: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    border: 0,
    padding: '1rem',
    backgroundColor: 'transparent',
    fontFamily: tokens.fontStackPrimary,
    fontSize: tokens.fontSizeL,
    lineHeight: tokens.lineHeightDefault,
    color: tokens.colorTextBase,
    width: '100%',
    cursor: 'pointer',
    transition: `background-color ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,

    '&:hover': {
      backgroundColor: tokens.colorElementLightest,
    },
    '&:focus': {
      outline: 'none',
      backgroundColor: tokens.colorElementLightest,
    },
  }),
};

interface AccordionHeaderProps {
  children: React.ReactNode;
  handleClick: VoidFunction;
  isOpen: boolean;
  ariaId: number | null;
}

export const AccordionHeader: FC<AccordionHeaderProps> = ({
  children,
  handleClick,
  isOpen,
  ariaId,
}: AccordionHeaderProps) => {
  return (
    <Subheading>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`accordion-panel--${ariaId}`}
        id={`accordion--${ariaId}`}
        className={styles.accordionHeader}
        onClick={handleClick}>
        <Icon icon={isOpen ? 'ChevronDownTrimmed' : 'ChevronRightTrimmed'} color="secondary" />
        {children}
      </button>
    </Subheading>
  );
};
AccordionHeader.defaultProps = {
  isOpen: false,
};
