import { Action } from 'data/CMA/EntityActions';
import { template as loDashTemplate } from 'lodash';
import { EntityType, NumberOfLinks } from './constants';

export const template = (message, args) => loDashTemplate(message)(args);

export default {
  [Action.Unpublish()]: {
    [EntityType.ENTRY]: {
      [NumberOfLinks.ZERO]: {
        title: 'Are you sure?',
        body: 'There are no other entries that link to this entry.',
        confirm: 'Yes, unpublish entry'
      },
      [NumberOfLinks.ONE]: {
        title: 'This entry is linked in another entry',
        body:
          'There is one other entry that links to this entry. If you unpublish it, your app(s) might break.',
        confirm: 'Unpublish entry anyway'
      },
      [NumberOfLinks.MANY]: {
        title: 'This entry is linked in other entries',
        body:
          'There are ${numberOfLinks} other entries that link to this entry. If you unpublish it, your app(s) might break.',
        confirm: 'Unpublish entry anyway'
      }
    },
    [EntityType.ASSET]: {
      [NumberOfLinks.ZERO]: {
        title: 'Are you sure?',
        body: 'There are no entries that link to this asset.',
        confirm: 'Yes, unpublish asset'
      },
      [NumberOfLinks.ONE]: {
        title: 'This asset is linked in an entry',
        body:
          'There is one entry that links to this asset. If you unpublish it, your app(s) might break.',
        confirm: 'Unpublish asset anyway'
      },
      [NumberOfLinks.MANY]: {
        title: 'This asset is linked in a few entries',
        body:
          'There are ${numberOfLinks} entries that link to this asset. If you unpublish it, your app(s) might break.',
        confirm: 'Unpublish asset anyway'
      }
    }
  },
  [Action.Delete()]: {
    [EntityType.ENTRY]: {
      [NumberOfLinks.ZERO]: {
        title: 'Are you sure?',
        body: 'There are no other entries that link to this entry.',
        confirm: 'Yes, delete entry'
      },
      [NumberOfLinks.ONE]: {
        title: 'Delete entry',
        body:
          'There is one other entry that links to this entry. If you delete it, your app(s) might break.',
        confirm: 'Delete entry anyway'
      },
      [NumberOfLinks.MANY]: {
        title: 'This entry is linked in other entries',
        body:
          'There are ${numberOfLinks} other entries that link to this entry. If you delete it, your app(s) might break.',
        confirm: 'Delete entry anyway'
      }
    },
    [EntityType.ASSET]: {
      [NumberOfLinks.ZERO]: {
        title: 'Are you sure?',
        body: 'There are no entries that link to this asset.',
        confirm: 'Yes, delete asset'
      },
      [NumberOfLinks.ONE]: {
        title: 'Delete asset',
        body:
          'There is one entry that links to this asset. If you delete it, your app(s) might break.',
        confirm: 'Delete asset anyway'
      },
      [NumberOfLinks.MANY]: {
        title: 'This asset is linked in a few entries',
        body:
          'There are ${numberOfLinks} entries that link to this asset. If you delete it, your app(s) might break.',
        confirm: 'Delete asset anyway'
      }
    }
  },
  [Action.Archive()]: {
    [EntityType.ENTRY]: {
      [NumberOfLinks.ZERO]: {
        title: 'Are you sure?',
        body: 'There are no other entries that link to this entry.',
        confirm: 'Yes, archive entry'
      },
      [NumberOfLinks.ONE]: {
        title: 'Archive entry',
        body:
          'There is one other entry that links to this entry. If you archive it, your app(s) might break.',
        confirm: 'Archive entry anyway'
      },
      [NumberOfLinks.MANY]: {
        title: 'This entry is linked in other entries',
        body:
          'There are ${numberOfLinks} other entries that link to this entry. If you archive it, your app(s) might break.',
        confirm: 'Archive entry anyway'
      }
    },
    [EntityType.ASSET]: {
      [NumberOfLinks.ZERO]: {
        title: 'Are you sure?',
        body: 'There are no entries that link to this asset.',
        confirm: 'Yes, archive asset'
      },
      [NumberOfLinks.ONE]: {
        title: 'Archive asset',
        body:
          'There is one entry that links to this asset. If you archive it, your app(s) might break.',
        confirm: 'Archive asset anyway'
      },
      [NumberOfLinks.MANY]: {
        title: 'This asset is linked in a few entries',
        body:
          'There are ${numberOfLinks} entries that link to this asset. If you archive it, your app(s) might break.',
        confirm: 'Archive asset anyway'
      }
    }
  }
};
