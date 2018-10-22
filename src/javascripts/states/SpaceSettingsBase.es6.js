import Base from 'states/Base.es6';
import { go } from 'states/Navigator.es6';
import { spaceResolver } from 'states/Resolvers.es6';

export function redirectReadOnlySpace(space) {
  if (space.readOnlyAt) {
    go({
      path: ['home']
    });
  }
}

export default function SpaceSettingsBase(definition) {
  const defaults = {
    resolve: {
      space: spaceResolver
    },
    onEnter: ['space', space => redirectReadOnlySpace(space)]
  };

  return Base(Object.assign(defaults, definition));
}
