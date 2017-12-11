import { h } from 'ui/Framework';

/**
 * This is a component that renders a dropdown menu for create-entry component.
 * @param {ContentType[]} contentTypes. A list of content types
 * @param {string?} suggestedContentTypeId. Id of a suggested content type.
 * @param {function (contentTypeId: string)} onSelect Called when the user selects a contentType
 */
export default function render ({
  contentTypes = [],
  suggestedContentTypeId = null,
  onSelect
}) {
  const suggestedContentType = getContentTypeById(
    contentTypes,
    suggestedContentTypeId
  );

  return h('.create-entry__menu', [
    ...suggestedContentTypeGroup({
      suggestedContentType,
      onSelect
    }),
    group({
      title: 'All content types',
      testId: 'group-all',
      contentTypes,
      onSelect
    })
  ]);
}

function suggestedContentTypeGroup ({ suggestedContentType, onSelect }) {
  if (!suggestedContentType) {
    return [];
  }

  return [
    group({
      title: 'Suggested content type',
      testId: 'group-suggested',
      contentTypes: [suggestedContentType],
      onSelect
    }),
    h('hr')
  ];
}

function group ({ title, testId, contentTypes, onSelect }) {
  return h('div', [
    h(
      '.context-menu__header',
      {
        dataTestId: testId
      },
      [title]
    ),
    h(
      'ul',
      contentTypes.map(contentType => {
        return h(
          'li',
          {
            dataTestId: 'contentType',
            role: 'menuitem',
            onClick: () => onSelect(contentType.sys.id)
          },
          [contentType.name || 'Untitled']
        );
      })
    )
  ]);
}

function getContentTypeById (contentTypes, id) {
  return contentTypes.find(ct => ct.sys.id === id);
}
