import React, { FC, useState, useLayoutEffect } from 'react';

import { AccordionHeader } from './AccordionHeader';
import { AccordionPanel } from './AccordionPanel';

export interface AccordionItemProps {
  /**
   * Child nodes to be rendered in the component
   */
  children?: React.ReactNode;
  /**
   * An ID used for testing purposes applied as a data attribute (data-test-id)
   */
  testId?: string;
  /**
   * The accordion title
   */
  title: React.ReactNode;
}

const defaultProps: AccordionItemProps = {
  title: 'Accordion Title',
  testId: 'cf-ui-accordion-item',
};

export const AccordionItem: FC<AccordionItemProps> = ({
  title,
  testId,
  children,
}: AccordionItemProps) => {
  const id = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  const onClick = () => setIsExpanded(!isExpanded);

  return (
    <li data-test-id={`${testId}-${id}`}>
      <AccordionHeader handleClick={onClick} isOpen={isExpanded} ariaId={id}>
        {title}
      </AccordionHeader>

      <AccordionPanel ariaId={id} isOpen={isExpanded}>
        {children}
      </AccordionPanel>
    </li>
  );
};
AccordionItem.defaultProps = defaultProps;

let initialId = 0;

function useId() {
  const [id, setId] = useState(initialId);

  useLayoutEffect(() => {
    setId(++initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return id;
}
