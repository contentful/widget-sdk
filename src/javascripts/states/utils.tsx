import React from 'react';
import * as TokenStore from 'services/TokenStore';
import { go } from 'states/Navigator';

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
        go({
          path: ['spaces', 'detail', 'home'],
          params: { spaceId: space.sys.id },
        });
      }
    }, [space]);

    return <Component {...props} />;
  }

  return WithRedirectReadOnlySpace;
}
