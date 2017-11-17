export const contentTypes = [
  {
    name: 'Brand',
    fields: [
      {
        id: 'Xv1N07BWAN4AV6a0',
        apiName: 'companyName',
        name: 'Company name',
        type: 'Text',
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'q7dedNda69jBv3hW',
        apiName: 'logo',
        name: 'Logo',
        type: 'Link',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: 'Asset'
      },
      {
        id: 'hx3BIlAyjazjkz3k',
        apiName: 'companyDescription',
        name: 'Description',
        type: 'Text',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'DjQpjEgwJIwjW0wB',
        apiName: 'website',
        name: 'Website',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [
          {
            regexp: {
              pattern:
                '\\b((?:[a-z][\\w-]+:(?:\\/{1,3}|[a-z0-9%])|www\\d{0,3}[.]|[a-z0-9.\\-]+[.][a-z]{2,4}\\/)(?:[^\\s()<>]+|\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\))+(?:\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[\\]{};:\'".,<>?«»“”‘’]))',
              flags: 'i'
            }
          }
        ],
        disabled: false,
        omitted: false
      },
      {
        id: 'Gdv9NafBC7Y4zC2M',
        apiName: 'twitter',
        name: 'Twitter',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'XP8Cnq5kGFMGdZnn',
        apiName: 'email',
        name: 'Email',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [
          {
            regexp: {
              pattern: '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,4}$',
              flags: 'i'
            }
          }
        ],
        disabled: false,
        omitted: false
      },
      {
        id: 'Kdf6I8QDWVvKHXvi',
        apiName: 'phone',
        name: 'Phone #',
        type: 'Array',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        items: { type: 'Symbol', validations: [] }
      }
    ],
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'vu21149elxz0' } },
      id: 'TEST_CT_ID',
      type: 'ContentType',
      createdAt: '2017-10-02T14:42:27.622Z',
      updatedAt: '2017-10-02T14:42:27.622Z',
      revision: 1
    },
    displayField: 'Xv1N07BWAN4AV6a0',
    description: null
  },
  {
    name: 'Product',
    fields: [
      {
        id: 'cHEJOi10pQAl2kxc',
        apiName: 'productName',
        name: 'Product name',
        type: 'Text',
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'YoDVkgPLav8j2lxe',
        apiName: 'slug',
        name: 'Slug',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'h9h35iwlfZ37pypH',
        apiName: 'productDescription',
        name: 'Description',
        type: 'Text',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'YBfvVmBiMXojmOxJ',
        apiName: 'sizetypecolor',
        name: 'Size/Type/Color',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'i6AO36v6QWmoMBhJ',
        apiName: 'image',
        name: 'Image',
        type: 'Array',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        items: { type: 'Link', validations: [], linkType: 'Asset' }
      },
      {
        id: 'AyccV8QAbHXGMl8q',
        apiName: 'tags',
        name: 'Tags',
        type: 'Array',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        items: { type: 'Symbol', validations: [] }
      },
      {
        id: 'pqEIHYg8Z8BigiXn',
        apiName: 'categories',
        name: 'Categories',
        type: 'Array',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        items: {
          type: 'Link',
          validations: [{ linkContentType: ['6XwpTaSiiI2Ak2Ww0oi6qa'] }],
          linkType: 'Entry'
        }
      },
      {
        id: 'MwJNvWBy68pHGMKB',
        apiName: 'price',
        name: 'Price',
        type: 'Number',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'BwDj6OJm1L11Ponh',
        apiName: 'brand',
        name: 'Brand',
        type: 'Link',
        localized: false,
        required: false,
        validations: [{ linkContentType: ['sFzTZbSuM8coEwygeUYes'] }],
        disabled: false,
        omitted: false,
        linkType: 'Entry'
      },
      {
        id: 'BjaWGW0bhdGzh53J',
        apiName: 'quantity',
        name: 'Quantity',
        type: 'Integer',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'NxPdzDlK7fbpkMbb',
        apiName: 'sku',
        name: 'SKU',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'XB7W4OnWMnNjN3MK',
        apiName: 'website',
        name: 'Available at',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [
          {
            regexp: {
              pattern:
                '\\b((?:[a-z][\\w-]+:(?:\\/{1,3}|[a-z0-9%])|www\\d{0,3}[.]|[a-z0-9.\\-]+[.][a-z]{2,4}\\/)(?:[^\\s()<>]+|\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\))+(?:\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[\\]{};:\'".,<>?«»“”‘’]))',
              flags: 'i'
            }
          }
        ],
        disabled: false,
        omitted: false
      },
      {
        id: 'LipWIjzMnA2y0nxo',
        apiName: 'createdAt',
        name: 'createdAt',
        type: 'Date',
        localized: false,
        required: false,
        validations: [
          {
            dateRange: {
              after: null,
              before: null,
              min: '2017-10-14',
              max: '2017-10-17'
            }
          }
        ],
        disabled: false,
        omitted: false
      },
      {
        id: 'IlFE6gGqjBc1KpAO',
        apiName: 'location',
        name: 'location',
        type: 'Location',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      },
      {
        id: 'pQGOc1MOV0CyEDxz',
        apiName: 'justAnotherJsonField',
        name: 'Just another json field',
        type: 'Object',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false
      }
    ],
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'vu21149elxz0' } },
      id: '2PqfXUJwE8qSYKuM0U6w8M',
      type: 'ContentType',
      createdAt: '2017-10-02T14:42:27.614Z',
      updatedAt: '2017-11-17T08:40:21.062Z',
      revision: 12
    },
    displayField: 'cHEJOi10pQAl2kxc',
    description: null
  }
];

export const keyDown = ({ keyCode }) => {
  return new KeyboardEvent('keydown', {
    keyCode
  });
};
