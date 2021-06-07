import React from 'react';
import * as TokenStore from 'services/TokenStore';
import { router } from 'core/react-routing';

type WithRedirectReadOnlySpaceType = {
  spaceId: string;
};

export function withRedirectReadOnlySpace(Component) {
  function WithRedirectReadOnlySpace(props: WithRedirectReadOnlySpaceType) {
    const [space, setSpace] = React.useState<{ readOnlyAt: string; sys: { id: string } }>();

    React.useEffect(() => {
      async function loadSpace() {
        const spaceFromStore = await TokenStore.getSpace(props.spaceId);
        setSpace(spaceFromStore);
      }

      loadSpace();
    }, [props.spaceId]);

    React.useEffect(() => {
      if (space?.readOnlyAt) {
        router.navigate({ path: 'spaces.detail.home', spaceId: space.sys.id });
      }
    }, [space]);

    return <Component {...props} />;
  }

  return WithRedirectReadOnlySpace;
}
