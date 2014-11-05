{
  sys: {
    type: 'EditingInterface',
    id: 'asdasdasd'
  },
  title: 'Foo',
  contentTypeId: 'asdasd',
  widgets: [
    {
      id: random.id(),
      widgetType: 'field'
      fieldId: 'asdf'
      widgetId: 'widgetId',
      widgetParams: {...}
    },
    {
      id: random.id(),
      widgetType: 'static'
      widgetId: 'sectionHeader'
      widgetParams: {
        text: 'Foobar'
      }
    },
    {
      id: random.id(),
      widgetType: 'static'
      widgetId: 'infoText'
      widgetParams: {
        text: 'Foobar'
      }
    },
    {
      id: random.id(),
      widgetType: 'static'
      widgetId: 'sectionBreak'
      widgetParams: {
        text: 'Foobar'
      }
    },
    {
      id: random.id(),
      widgetType: 'static'
      widgetId: 'image'
      widgetParams: {
        href: '...'
        altText: 'Foobar'
      }
    },

  ]
}
