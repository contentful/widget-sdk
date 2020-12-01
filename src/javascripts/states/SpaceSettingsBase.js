import Base from 'states/Base';
import { go } from 'states/Navigator';
import { spaceResolver } from 'states/Resolvers';

export function redirectReadOnlySpace(space) {
  if (space.readOnlyAt) {
    go({
      path: ['spaces', 'detail', 'home'],
      params: { spaceId: space.sys.id },
    });
  }
}

export default function SpaceSettingsBase(definition) {
  const defaults = {
    resolve: {
      space: spaceResolver,
    },
    onEnter: ['space', (space) => redirectReadOnlySpace(space)],
  };

  return Base(Object.assign(defaults, definition));
}
