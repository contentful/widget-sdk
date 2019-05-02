import React from 'react';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { CardDragHandle } from '@contentful/forma-36-react-components';

export const DragHandle = sortableHandle(() => <CardDragHandle>Reorder item</CardDragHandle>);

const SortableLink = sortableElement(({ value }) => <li className="link-editor__link">{value}</li>);

const SortableLinkList = sortableContainer(({ items }) => (
  <ol className="link-editor__links">
    {items.map((item, index) => (
      <SortableLink key={item.key} index={index} value={item.value} />
    ))}
  </ol>
));
export default SortableLinkList;

export function linksToListItems(links, renderLinkFn) {
  const linkKeys = getLinkKeys(links);
  return links.map((link, index) => ({
    key: linkKeys[index],
    value: renderLinkFn(link, index)
  }));
}

function getLinkKeys(links) {
  const countPerId = {};
  return links.map(link => {
    const { id } = link.sys;
    countPerId[id] = (countPerId[id] || 0) + 1;
    return `${id}:${countPerId[id] - 1}`;
  });
}
