# ContentfulCDA

This is a core feature that contains all the things a developer need to use Contentful as a CMS for the user_interface app

## CDA Clients

In `CDAClients.js`, we store the function that is used to initialise any CDAClient and also the functions related to all the particular spaces we eventually use in the user_interface.

For now, we are only using one space set in the `Contentful ProdDev` organization in our Contentful account. The name of the space is `Webapp content`

if you do not have access to this account, organization or space, please contact your PM, EM or the front end chapter to provide that for you.

To initialise a client you just need to:

```js
import { initCDAClient } from 'core/services/ContentfulCDA';

const client = initCDAClient('my_space_id', 'my_access_token');
```

To initialise the **Webapp content** space in particular you can use:

```js
import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

const client = await initWebappContentCDAClient();
```

## Fetching in Webapp content space

To fetch an entry in our main space, it's possible to use the fetchWebappContentByEntryID util and it will initialise the client for the Webapp content space, fetch the entry and return it. To use it, you only need to pass the entry's id

```js
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

const myEntry = await fetchWebappContentByEntryID('my_entry_id');
```

### Typescript

When using TS it's possible to type the return value of your entry, like this:

```ts
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

interface MyEntryType {
  name: string;
}

const myEntry = await fetchWebappContentByEntryID<MyEntryType>('my_entry_id');
// myEntry will be of type MyEntryType
```

## ContentfulRichText

A very common use case in Contentful is to create entries that have rich text fields. The CDA response for a rich text field is a very long and complex JSON object that is hard to manipulate.

The ContentfulRichText is react component that uses `@contentful/rich-text-react-renderer` to render a rich text content using Forma 36 components. To use it, you just need to pass the rich text that you fetched in the `document` prop, like this:

```js
import { fetchWebappContentByEntryID } from  'core/services/ContentfulCDA';

const myEntryWithRichtTxt = await fetchWebappContentByEntryID<MyEntryType>('my_entry_id')

<ContentfulRichText document={myEntryWithRichtTxt['rich_text_field']} />
```

In case you have embedded other content entries in your rich text, you can customise the way we render those entries by passing a `customRenderNode` prop. Like this:

```js
import { fetchWebappContentByEntryID } from  'core/services/ContentfulCDA';

const myEntryWithRichtTxt = await fetchWebappContentByEntryID<MyEntryType>('my_entry_id')

<ContentfulRichText
  document={myEntryWithRichtTxt['rich_text_field']}
  customRenderNode={{
    'paragraph': (_node, children) => <Paragraph>{children}</Paragraph>,
    'embedded-entry-inline': (node) => <div>{node.fields['my_inline_entry']}</div>,
  }}
/>
```

check the documentation of @contentful/rich-text-react-renderer for more information on how to customise render node
