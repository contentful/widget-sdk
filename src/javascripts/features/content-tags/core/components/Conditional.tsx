import * as React from 'react';

type Props = React.PropsWithChildren<{
  condition: boolean;
}>;

const Conditional: React.FC<Props> = ({ condition, children }) => {
  return <>{condition ? children : null}</>;
};

export { Conditional };
