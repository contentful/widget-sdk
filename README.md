# Contentful Widget SDK

The custom widgets API allows you to personalize the Contentful Web
Application's entry editor, so that you can build plugins that meet your
specific content editing or content management needs. It operates on top of any
of our current field types, and gives you the power to manipulate its data
through an iframe where you can embed custom functionality, styling,
integrations or workflows.

## Widgets taxonomy and example use cases

Conceptually, there are two main categories of custom widgets, for content
editing and content management. Editing widgets reside on the main body of the
entry editor and operate on top of a particular field or set of fields, while
the management widgets perform actions on the entire entry.

### Content editing widgets
Content editing widgets can operate on either single fields, or multiple fields.

#### Single field widgets
Content editing widgets applied to single fields are great for circumstances
where you just want to customize how you edit a particular field type. Examples
of single field widgets are:

* Integration with external digital asset management system (i.e. flickr) to
  insert external assets
* Specific data manipulation, like removing an element ID for a social media
  link
* Integration with a translation API service to programmatically translate the
  field's content
* Creation or integration with custom text editing interface

#### Multiple field widgets
If you need more than a single field, you can try multi-field level widgets.
Currently we have two approaches for this:

#### Using JSON objects
The first is a simple approach is to use a JSON object field type and construct
any complex field type that is not provided out of the box by Contentful, along
with its UI and logic. However, there is a tradeoff when using this approach.
Data inside of a JSON field cannot be used to query or filter entries in our
APIs.

#### Using relationships between multiple fields
This approach involves creating a single field custom widget that can use our
CMA to perform operations on other fields within the entry.
Examples of multi-field-level widgets are:

* Automatic asset metadata creation: When inserting an asset on a media field I
  want the long-text field below it to query our copyright database and fill-in
  the details for the asset above
* Custom recipes: When selecting an item from a dropdown menu I want the content
  of a short-text field type to change

### Content management widgets

Content management widgets reside on the sidebar and allow for actions that
include every element in the entry. These are better suited for tasks related to
workflows, data-management, integrations, etc.
Examples of entry-level widgets are:

* Custom webhooks/notifications
* Integration with a preview environment
* Moving entries across different spaces

## Getting Started

The most convenient way to upload and manage widgets through our API is via the
[`contenful-widget`][cf-widget-cli] command line tool. You can install it with

```bash
npm install -g "git+ssh@github.com:contentful/contentful-widget-cli.git"
```

Including the compiled version of the widget client library is as simple as
adding the following line to your application.

```html
<script src="https://contentful.github.io/widget-sdk/cf-widget-api.js"></script>
```

*As of now we do not distribute this repository through npm.*

If you want to learn how to write your own widgets and see them in
action, checkout the documentation for the
[Number Dropdown Widget](./examples/number-dropdown)

[cf-widget-cli]: https://github.com/contentful/contentful-widget-cli


## Examples

#### [Basic Number dropdown](examples/number-dropdown)

Basic widget that helps you *get started* with developing. Uses a dropdown to
change the value of a number field and makes some CMA requests.

#### [Chessboard](examples/chessboard)

This widget displays a chessboard and stores the board position as a JSON
object. You can drag pieces on the chessboard and the position data will be
updated automatically. The widget also supports *collaborative editing*. If two
editors open the same entry moves will be synced between them.

#### [Slug Generator](examples/slug)

This widget will automatically generate its values from an entries title field.
For example typing “Hello World” into the title field will set the widgets input
field to “hello-world”. It will also check the uniquness of the slug across a
customizable list of content types.

This examples highlights how the widget API can be used to *inspect any value*
of an entry and *react to changes*.

#### [Rich Text Editor](examples/alloy-editor)

This example integrates the [Alloy rich text editor](http://alloyeditor.com/) to
edit “Text” fields.

#### Json Editor widget
* Run `npm install && gulp`
* This will install and inline all of the dependencies to the `index.html` file in the `/dist` directory
* This example uses the `srcdoc` property - the widget source file is hosted on Contentful

#### Translate widget

* Run `npm install && gulp`
* This will install and inline all of the dependencies to the `index.html` file in the `/dist` directory
* This example uses the `srcdoc` property - the widget source file is hosted on Contentful


## Providing Feedback

Technical feedback can be provided directly through the Github repo. This has
several advantages, including a closer communication between developers and a
single point of information. Answers provided to one participant may also be
relevant to others, and we can use this space for a healthy and open
communication channel. However, if at any point some confidential or business
sensitive information needs to be discussed, then the conversation would
temporarily be handled via Zendesk.

We are mostly interested in technical details (custom widgets management, SDK,
API, specific functionality details) and use cases (concert examples of problems
that your organization could solve using custom widgets).


## End of Preview Program

The custom widgets preview program will end once we achieve a stable and
reliable specification definition. At this point, participants of the program
will be notified of an internal stable release as well as provided an estimate
on when the feature will be made available to the general public. At this time,
it would be advisable for participants to start thinking into how to incorporate
this feature in their production environment since this version of the
specification will be officially supported.

Of course, participants in the program are free to stop participating at any time.
