import {h} from 'ui/Framework';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';

export default function apis () {
  return h('.docs-sidebar__line', [
    h('strong', {
      style: {
        marginBottom: '10px',
        display: 'block'
      }
    }, ['Here‘s what you can do with each API:']),
    apiDescription({
      href: 'https://www.contentful.com/developers/docs/references/content-delivery-api/',
      text: 'Content Delivery API',
      description: 'Deliver content to any client, with high speed'
    }),
    apiDescription({
      href: 'https://www.contentful.com/developers/docs/references/content-management-api/',
      text: 'Content Management API',
      description: 'Programmatically create or update content'
    }),
    apiDescription({
      href: 'https://www.contentful.com/developers/docs/references/content-preview-api/',
      text: 'Content Preview API',
      description: 'Preview unpublished content ("Draft" status)'
    }),
    apiDescription({
      href: 'https://www.contentful.com/developers/docs/references/images-api/',
      text: 'Images API',
      description: 'Retrieve and apply transformations to images'
    })
  ]);
}

function apiDescription ({ href, text, description }) {
  return h('div', [
    h('a.text-link', {
      href,
      style: {
        display: 'block'
      },
      onClick: () => trackLinkClick(href)
    }, [text]),
    h('p', [description])
  ]);
}
