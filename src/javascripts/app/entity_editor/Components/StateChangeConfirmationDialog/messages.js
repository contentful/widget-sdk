import { Action } from 'data/CMA/EntityActions';
import { EntityType, NumberOfLinks } from '../constants';

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
        title: 'Permanently delete this entry?',
        body:
          "Once you delete this entry, it's gone for good and cannot be retrieved. We suggest archiving if you need to retrieve it later. No other entries link to this entry.",
        confirm: 'Permanently delete',
        secondary: 'Archive instead'
      },
      [NumberOfLinks.ONE]: {
        title: 'Permanently delete this entry? It is linked in another entry.',
        body:
          "Once you delete this entry, it's gone for good and cannot be retrieved. Your app(s) might also break. We suggest archiving if you need to retrieve it later. One other entry links to this entry.",
        confirm: 'Permanently delete',
        secondary: 'Archive instead'
      },
      [NumberOfLinks.MANY]: {
        title: 'Permanently delete this entry? It is linked in other entries.',
        body:
          "Once you delete this entry, it's gone for good and cannot be retrieved. Your app(s) might also break. We suggest archiving if you need to retrieve it later. ${numberOfLinks} other entries link to this entry.",
        confirm: 'Permanently delete',
        secondary: 'Archive instead'
      }
    },
    [EntityType.ASSET]: {
      [NumberOfLinks.ZERO]: {
        title: 'Permanently delete this asset?',
        body:
          "Once you delete this asset, it's gone for good and cannot be retrieved. We suggest archiving if you need to retrieve it later. No entries link to this asset.",
        confirm: 'Permanently delete',
        secondary: 'Archive instead'
      },
      [NumberOfLinks.ONE]: {
        title: 'Permanently delete this asset? It is linked in an entry.',
        body:
          "Once you delete this asset, it's gone for good and cannot be retrieved. Your app(s) might also break. We suggest archiving if you need to retrieve it later. One entry links to this asset.",
        confirm: 'Permanently delete',
        secondary: 'Archive instead'
      },
      [NumberOfLinks.MANY]: {
        title: 'Permanently delete this asset? It is linked in a few entries.',
        body:
          "Once you delete this asset, it's gone for good and cannot be retrieved. Your app(s) might also break. We suggest archiving if you need to retrieve it later. ${numberOfLinks} entries link to this asset.",
        confirm: 'Permanently delete',
        secondary: 'Archive instead'
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
        title: 'This entry is linked in another entry',
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
        title: 'This asset is linked in an entry',
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
