module.exports = {
  sys: {
    id: undefined,
    type: 'AssetContentType'
  },
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      localized: true,
      disabled: true
    },
    {
      id: 'description',
      name: 'Description',
      type: 'Text',
      localized: true,
      disabled: false
    },
    {
      id: 'file',
      name: 'File',
      type: 'File',
      localized: true,
      disabled: false,
      required: true
    }
  ]
};
