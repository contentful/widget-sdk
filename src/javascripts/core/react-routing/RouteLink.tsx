import * as React from 'react';
import { createPath } from 'history';
import { LinkProps, useHref, useLocation, useNavigate, useResolvedPath } from 'react-router-dom';
import { RouteType } from './routes';
import { router } from './useRouter';

function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export const RouteLink = (
  props: Omit<LinkProps, 'to'> & { as?: any; route: RouteType | string }
) => {
  const { route, state, ...rest } = props;
  let to = '';
  let fullState = state;
  if (typeof route === 'string') {
    to = route;
  } else {
    // @ts-expect-error
    fullState = { ...route?.navigationState, ...fullState };
    to = router.href(route);
  }
  return <Link {...rest} to={to} state={fullState} />;
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps & { as?: any }>(function LinkWithRef(
  { onClick, replace: replaceProp = false, as: asComponent, state, target, to, ...rest },
  ref
) {
  const href = useHref(to);
  const navigate = useNavigate();
  const location = useLocation();
  const path = useResolvedPath(to);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (onClick) onClick(event);
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // Ignore everything but left clicks
      (!target || target === '_self') && // Let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // Ignore clicks with modifier keys
    ) {
      event.preventDefault();

      // If the URL hasn't changed, a regular <a> will do a replace instead of
      // a push, so do the same here.
      const replace = !!replaceProp || createPath(location) === createPath(path);

      navigate(to, { replace, state });
    }
  }

  const Component = asComponent || 'a';

  return <Component {...rest} href={href} onClick={handleClick} ref={ref} target={target} />;
});
