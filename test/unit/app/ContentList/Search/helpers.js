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
      id: 'sFzTZbSuM8coEwygeUYes',
      type: 'ContentType',
      createdAt: '2017-10-02T14:42:27.622Z',
      updatedAt: '2017-10-02T14:42:27.622Z',
      revision: 1
    },
    displayField: 'Xv1N07BWAN4AV6a0',
    description: null
  }
];

export const keyDown = ({ key }) => {
  return new KeyboardEvent('keydown', {
    key: key
  });
};
