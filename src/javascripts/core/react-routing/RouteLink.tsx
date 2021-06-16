import * as React from 'react';
import { createPath, State } from 'history';
import { LinkProps, useHref, useLocation, useNavigate, useResolvedPath } from 'react-router-dom';
import { RouteType } from './routes';
import { router } from './useRouter';
import { cx } from 'emotion';

type RouteLinkChildrenFn = (params: {
  getHref: () => string;
  onClick: (e?: any) => unknown;
  isActive?: boolean;
}) => React.ReactElement;

function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

function getToAndState(route: RouteType | string, state?: State): { to: string; state?: State } {
  // Allows relative paths
  if (typeof route === 'string') {
    return { to: route, state };
  }
  return { to: router.href(route), state: { ...(route as any)?.navigationState, ...state } };
}

type RouteLinkProps = Omit<LinkProps, 'to'> & {
  route: RouteType | string;
  as?: any;
  children: React.ReactNode | RouteLinkChildrenFn;
  testId?: string;
  handlePrevented?: boolean;
  activeClassName?: string;
};

export const RouteLink = (props: RouteLinkProps) => {
  const { children, activeClassName, ...rest } = props;
  const { to, state } = getToAndState(props.route, props.state);

  const href = useHref(to);
  const navigate = useNavigate();
  const location = useLocation();
  const path = useResolvedPath(to);

  const locationPathname = location.pathname;
  const toPathname = path.pathname;

  const isActive = locationPathname === toPathname;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) props.onClick(event);
    if (
      (!event.defaultPrevented || props.handlePrevented) && // onClick prevented default
      event.button === 0 && // Ignore everything but left clicks
      (!props.target || props.target === '_self') && // Let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // Ignore clicks with modifier keys
    ) {
      event.preventDefault();

      // If the URL hasn't changed, a regular <a> will do a replace instead of
      // a push, so do the same here.
      const replace = !!props.replace || createPath(location) === createPath(path);

      navigate(to, { replace, state });
    }
  }

  if (typeof children === 'function') {
    return (children as RouteLinkChildrenFn)({
      getHref: () => href,
      onClick: handleClick,
      isActive,
    });
  }

  return (
    <Link
      {...rest}
      className={cx(props.className, isActive ? activeClassName : null)}
      to={to}
      state={state}
      href={href}
      onClick={handleClick}>
      {children}
    </Link>
  );
};

const Link = React.forwardRef<
  HTMLAnchorElement,
  LinkProps & {
    href: string;
    as?: any;
  }
>(function LinkWithRef({ onClick, as: asComponent, href, target, ...rest }, ref) {
  const Component = asComponent || 'a';

  return <Component {...rest} href={href} onClick={onClick} ref={ref} target={target} />;
});
