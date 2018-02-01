import { EntityType, NumberOfLinks } from '../constants';

export default {
  [EntityType.ENTRY]: {
    [NumberOfLinks.ZERO]: {
      subtitle: 'No other entries link to this entry.'
    },
    [NumberOfLinks.ONE]: {
      subtitle: 'There is one other entry that links to this entry:'
    },
    [NumberOfLinks.MANY]: {
      subtitle:
        'There are ${numberOfLinks} other entries that link to this entry:'
    }
  },
  [EntityType.ASSET]: {
    [NumberOfLinks.ZERO]: {
      subtitle: 'No entries link to this asset.'
    },
    [NumberOfLinks.ONE]: {
      subtitle: 'There is one entry that links to this asset:'
    },
    [NumberOfLinks.MANY]: {
      subtitle: 'There are ${numberOfLinks} entries that link to this asset:'
    }
  }
};
