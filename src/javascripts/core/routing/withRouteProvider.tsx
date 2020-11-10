import * as React from 'react';
import { RouteProps } from './RouteProps';
import { RouteProvider } from './RouteProvider';

type Props = React.PropsWithChildren<RouteProps>;

const RouteComponent: React.FC<Props> = ({ children, ngStateUrl }) => {
  return <RouteProvider ngStateUrl={ngStateUrl}>{children}</RouteProvider>;
};

export function withRouteProvider(WrappedComponent) {
  return function (props: RouteProps): React.ReactElement<Props> {
    return (
      <RouteComponent ngStateUrl={props.ngStateUrl}>
        <WrappedComponent {...props} />
      </RouteComponent>
    );
  };
}
