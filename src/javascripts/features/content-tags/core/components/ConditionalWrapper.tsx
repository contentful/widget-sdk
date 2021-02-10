import React, { ReactNode } from 'react';

type Props = React.PropsWithChildren<{
  condition: boolean;
  wrapper: (children: ReactNode) => ReactNode;
}>;

const ConditionalWrapper: React.FC<Props> = ({ condition, wrapper, children }) => {
  return <>{condition ? wrapper(children) : children}</>;
};

export { ConditionalWrapper };
