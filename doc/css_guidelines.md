# CSS Guidelines

The purpose of this document is to establish a set of guidelines for our
CSS code so we can keep it clean, organized, modular and reusable.

Guidelines in terms of file structure and naming should be treated more
as rules and any exception needs to be thought of and discussed.

It should also be noted that at the time of writing, these guidelines
are not yet implemented and existing code will be migrated over time to
reflect these guidelines.

**These guidelines are evolving continuously, and are based on the work
and recommendations of many others. Some references will be sprinkled
throughout the document and it is recommended that you click them and
read them as we are adopting bits and pieces of existing guidelines.**

Remaining reference links that influenced the document at a more overall
level will be linked at the bottom. **The first 2 links in the
references are required reading to go with this guide**. SMACSS is also
very recommended.

## Tools

- At the moment we are using Stylus with nib.
- There are some full page CSS tests using webdrivercss under
  bin/css-tests.js (**TODO**: add more info on setup)
- **TODO** outline use of KSS

## Fonts

TODO: this should also go in the styleguide

https://www.google.com/fonts/specimen/Lato 13px
Currently imported variants: 
* 300
* 300italic
* 400
* 400italic
* 700
* 700italic

## Syntax

Because we are using Stylus which is very liberal in its syntax, the
following outlines some rules for how we're writing our CSS.

Example:
```css
.selector
  property: value
```
- 2 space soft tabs
- one selector per line
- space after `:`
- prefix variables with `$`
- if using mixins from nib, you can call them as if they were existing
  properties (because many of them will be): `box-sizing: border-box`
- if using or creating our own mixins or functions, prefix them with $
- [Avoid shorthand](https://github.com/csswizardry/CSS-Guidelines#shorthand) unless you are specifying all possible values of a
  property, as you'll just be setting more properties that could have to
  be overriden
- `!important` should never be used, except for state rules (see below),
  and only when absolutely necessary and as a last resort.

## Methodology

The methodology to be followed is an adaption of [SMACSS](https://smacss.com/) 
with some differences and additional rules and recommendations,
specified throughout this document. Some of those rules and
recommendations that don't belong anywhere else in the document:
- Never use class names for JS hooks. In our case, this should be
  covered by our Angular JS Coding Guidelines.
- [Keep positioning](https://github.com/csswizardry/CSS-Guidelines#layout), width and height in `layout` classes. Try not to
  specify these in `modules` or `objects`. Layout/positioning and other
  properties should be combined through classes applied to an element
- [Try to use heights](https://github.com/csswizardry/CSS-Guidelines#layout) only on things which have predefined heights like images
  or sprites
- Only use mixins for things that take parameters, don't use them for
  pattern repetition. Prefer classes instead.
- Avoid writing rules that do too much
- Never leave commented out code lying around. If you want to make a
  note of it, use a single commit to remove old code.

## File structure

Listed by lower to higher level:

- **variables**: variables by theme
- **base**: base styles and variables
- **mixins**: standalone mixins
- **objects**: visual objects, with no further hierarchy below them
- **modules**: modules composed by visual objects, with some level of
  hierarchy
- **layouts**: layouts for pages or modules (not composed of modules)
- **vendor**: vendor components

## Declaration order

- **Positioning**: position, top, left, right, bottom, margin, z-index
- **Flex**: flex-*
- **Box model**: display, float, overflow, width, height, padding
- **Typography**: font-*, text-*, break-*, word-*, line-*, list-*
- **Visual**: border, background, shadows, colors, animation
- **Misc**

Reference (not strictly or closely followed): [Recess](https://github.com/twitter/recess/blob/master/lib/lint/strict-property-order.js)

## Selectors

- Avoid using IDs unless for the definition of some top level layout
  components
- Never declare the same class in two different places. If you're
  separating something into 2 definitions, you want 2 different classes.

### Naming
Selectors should be lowercase, with multiple words separated by dashes.

- **Layouts**: `.l-layout-name` Ex: `.l-entry-editor`
- **Components**: `.component`, `.component-name`
- **Variants**: `.component--variant` Ex: `.btn`, `.btn--primary`
- **Nested elements**: `.component__nested-element` 
- **Modifiers/State**: `.component.is-active`
  - If a state is something generic, declare it as a global state
  - If a state is specific to a module, scope it: `.component.is-active`
    or using the `&.is-active` nesting selector
  - If a state rule is very specific for one particular object/module,
    and it's not scoped, it should contain that module name: `.is-tab-active`
- Utilities can have some more generic names, but if necessary, prefix
  them with `.u-name` to avoid clashes.

### Nesting
- Avoid nesting as much as possible:
  - You should never nest without a specific reason to do so.
  - The only valid reason for nesting should be when creating modules
    (more on this ahead)
  - If a module or object is only used on one section of the website,
    it's not a good reason for nesting.
  - if there is an hierarchy on a module you want to respect, use the
    nested elements naming scheme.
  - If nesting, always declare all properties of a given element first,
    and only then the nested properties.
  - If you still think you need to nest, you probably actually don't.
- Avoid using top level page classes to scope styles, prefer variants or
  new classes entirely. Example:
```css
.pod {
  width: 100%;
}

#sidebar .pod {
  width: 200px;
}

// should be
.pod {
  width: 100%;
}

.pod--constrained {
  width: 200px;
}

```

### Modules

From SMACSS:

    As briefly mentioned in the previous section, a Module is a more discrete
    component of the page. It is your navigation bars and your carousels and your
    dialogs and your widgets and so on. This is the meat of the page. Modules sit
    inside Layout components. Modules can sometimes sit within other Modules, too.
    Each Module should be designed to exist as a standalone component. In doing so,
    the page will be more flexible. If done right, Modules can easily be moved to
    different parts of the layout without breaking.

- Avoid element selectors that do not contain any semantic meaning,
  such as `span` or `div`.
- If you do use an element selector, always use the child selector `>`
- If you use a descendant selector (`.widget h2`) make sure you have a
  good reason for it, and a predictable html structure
- If you want to use a `span` or `div` in a module, the nested object
  should use a class name
- While the term **nested** is using here, you should use the definition
  of nesting from the name section for class names.
- Full example:
```css
.widget {}
.widget > h2 {}
.widget__nested-class-name {}
```

## Media queries

- Media queries should always be declared right after the block that
  defines a set of rules, and never on a separate file:

```css
.module
  width: 1200px

@media (max-width: 960px)
  .module
    width: 100%
```

# Reference links

## Required reading
- http://nicolasgallagher.com/about-html-semantics-front-end-architecture/
- http://philipwalton.com/articles/css-architecture/

## Recommended reading
- https://smacss.com/

## Other ideas and influences
- https://medium.com/@drublic/css-naming-conventions-less-rules-more-fun-12af220e949b
- http://www.slideshare.net/spirosmartzoukos/lessons-learnt-from-the-fontshop-site-relaunch (slide 6)
- http://www.edenspiekermann.com/blog/oocss-and-the-pagification-of-modules
- http://csswizardry.com/2014/01/extending-silent-classes-in-sass/
- https://github.com/csswizardry/inuit.css
- http://mdo.github.io/code-guide/
- https://github.com/csswizardry/CSS-Guidelines

