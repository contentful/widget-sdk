---
id: UIEP-0003
title: CSS-in-JS using emotion
champions: ['Mudit Ameta (@zeusdeux)', 'Alex Suevalov (@suevalov)']
endDate: March 4th, 2019
---

# [UIEP-0003] CSS-in-JS using [emotion](https://emotion.sh)

## Motivation

Current state of styling in the web app is very fragmented.
We have a mix of inline styles and classes defined in our stylus files.
We also have styles coming in from various sources including Forma36.
This leads to various problems arising from unclear precedence and css specificity.
It also makes it hard for us to de-duplicate CSS rules and identify + eliminate unused styles.
Finally, the current setup makes it impossible to use Forma36 tokens inside the `.styl` files.

We propose switching to a CSS-in-JS solution that lets us have sane precedence (due to a saner
model around “Order of appearance”), dead-code elimination, co-location of styles and logic,
better dev ergonomics and simpler composability of rules and tokens.

**We specifically propose using [emotion](https://emotion.sh).**
This proposal evaluates both framework agnostic emotion and v10 which is a massive departure from v9.
The goal of this proposal is two-fold —

1. Decide on using emotion as our CSS-in-JS solution
2. Decide on which version of it we want to use (v10 or framework agnostic)
   - note that this PR implements the framework agnostic approach

Following are the characteristics we have used as our guiding principles in picking a solution —

- Colocation of styles and components
- Sane precedence
- Simpler mental modal (no more specificity or “the cascade” worries)
- Straightforward usage modal (especially important when comparing v10 and framework agnostic version of emotion)
- Best in class dev ergonomics
- Ease of usage with Forma36
- Simple primitives for composability
- Support for dead code elimination
- High perf + small size

## Solutions looked at

### [styled-components](https://www.styled-components.com/)

The most popular CSS-in-JS library on a market.

- ✅ Compatible with React and React Native
- ✅ Good Typescript support
- ✅ Co-location and easy of removal
- ✅ Themes, animations, ability to compose styles
- ✅ Good tooling: ESLint plugins, Jest integration, syntax highlighting support available for popular editors
- ✅ Easy to use Forma36 tokens, since it's just JavaScript
- 💔 You cannot create styles without creating a component which is not always needed, tightly coupled to React
- 💔 [15.8Kb (min + gzip)](https://bundlephobia.com/result?p=styled-components@4.1.3)
- 💔 Not the most performant solution, two times slower than `emotion` [results](https://github.com/A-gambit/CSS-IN-JS-Benchmarks/blob/master/RESULT.md)

### [CSS Modules](https://github.com/css-modules/css-modules)

This is not a CSS-in-JS solution, but a way how the bundler (webpack in our case) processes CSS files.
All class and animation names are scoped locally by default.

```css
/* style.css */
.greenItem {
  color: green;
}
```

When importing the CSS module from a JS module, it exports an object with all mappings from local names to global names.

```js
import styles from './style.css';

<div className={styles.greenItem} />;
```

- ✅ CSS is just CSS, but with automated BEM notation and protection about clash of classes
- ✅ Zero run-time
- ✅ Co-location and easy of removal
- 💔 Style composition is a bit of a pain
- 💔 There are some problems relating to the CSS module `import` order which we've already seen in Forma36
- 💔 It's hard to use with our current Webpack + SystemJS + Karma configuration and involves hacks and workarounds

### [astoturf](https://github.com/4Catalyzer/astroturf)

`astroturf` lets you write CSS in your JavaScript files without adding any runtime layer, and works with your
existing CSS processing pipeline. The API is really similar to `styled-components` and `emotion`, but without
dynamic properties.

- ✅ Zero runtime CSS-in-JS
- ✅ Co-location and ease of removal
- 💔 API for composability looks [weird](https://github.com/4Catalyzer/astroturf#composition-variables-etc)
- 💔 Complicated to integrate to our Webpack + Gulp pipeline, as it has to export static CSS files as a result of a build.

### [emotion](https://github.com/emotion-js/emotion)

Second most popular CSS-in-JS library on the market.

- ✅ Compatible with React and can be framework agnostic
- ✅ Good Typescript support
- ✅ Co-location and easy of removal
- ✅ Themes, animations, ability to compose styles
- ✅ Good tooling: ESLint plugins, Jest, syntax highlighting support available for most editors
- ✅ Use can use both string templates and object notation for writing styles
- ✅ Easy to use Forma36 tokens, as it's just JavaScript
- ✅ You can create style without creating a component as it's API is just a function which produces unique CSS class names
- ✅ [5.7Kb (min + gzip)](https://bundlephobia.com/result?p=emotion@10.0.7) for framework agostic version
- ✅ One of the most performant runtime CSS-in-JS solutions [results](https://github.com/A-gambit/CSS-IN-JS-Benchmarks/blob/master/RESULT.md)
- 💔 About 16Kb (min + gzip) for a React-specific version of library
- 💔 Run-time
- 💔 Quite controversial API for React-specific v10 version of the library (see below)

## Chosen solution : Emotion

### Examples

Since emotion@v10 is a big departure from v9 and framework agnostic, it has a direct impact on
developer ergonomics and how you structure your code. Therefore, instead of static code snippets
as examples, codesandboxes are made available below for you to try out the variants. We hope
it’ll help you provide better feedback on this proposal.

#### V10

[![Edit emotion-react-v10](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/pmvy8y8vq)

#### Framework Agnostic

[![Edit emotion-framework-agnostic](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jlr25o5q3y)

### Developer experience

Both `emotion` and `@emotion/core` support [babel-plugin-emotion](https://emotion.sh/docs/babel-plugin-emotion)
which gives us a lot of features for free as you can see below.

<table>
  <thead>
    <tr>
      <th>Feature/Syntax</th>
      <th>Native</th>
      <th>Babel Plugin Required</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>css``</code></td>
      <td align="center">✅</td>
      <td align="center"></td>
      <td></td>
    </tr>
    <tr>
      <td><code>css(...)</code></td>
      <td align="center">✅</td>
      <td align="center"></td>
      <td>Generally used for object styles. Great TS support and autocomplete.</td>
    </tr>
    <tr>
      <td>components as selectors</td>
      <td align="center"></td>
      <td align="center">✅</td>
      <td>Allows an emotion component to be <a href="https://emotion.sh/docs/styled#targeting-another-emotion-component">used as a CSS selector</a>.</td>
    </tr>
    <tr>
      <td>Minification</td>
      <td align="center"></td>
      <td align="center">✅</td>
      <td>Any leading/trailing space between properties in your <code>css</code> and <code>styled</code> blocks is removed. This can reduce the size of your final bundle.</td>
    </tr>
    <tr>
      <td>Dead Code Elimination</td>
      <td align="center"></td>
      <td align="center">✅</td>
      <td>Uglifyjs will use the injected <code>/*#__PURE__*/</code> flag comments to mark your <code>css</code> and <code>styled</code> blocks as candidates for dead code elimination.</td>
    </tr>
    <tr>
      <td>Source Maps</td>
      <td align="center"></td>
      <td align="center">✅</td>
      <td>When enabled, navigate directly to the style declaration in your javascript file.</td>
    </tr>
    <tr>
      <td>Contextual Class Names</td>
      <td align="center"></td>
      <td align="center">✅</td>
      <td>Generated class names include the name of the variable or component they were defined in.</td>
    </tr>
  </tbody>
</table>

You can play with the code in this PR locally to see sourcemaps, etc in action.

### Migration path

All existing components can use emotion from the day this proposal is accepted and merged.
Once this is merged, no new `.styl` should be added to the codebase. Furthermore, we can
convert a lot of `.styl` files fairly quickly to styles that use emotion and that would
be expected as a part of the migration to react initiative.
`vendor` styles will most likely remain as-is. The goal for reducing vendor styles remains
unaffected by this proposal.

### Impact on Jest snapshots

To add support for snapshot testing, we propose using the serializer provided by [jest-emotion](https://github.com/emotion-js/emotion/tree/master/packages/jest-emotion). It's setup as a part of this PR and an example of `TypeformModal.spec.js`
and its snapshot is made available in this PR as well.

### Impact on Forma 36

If we go with framework agnostic version of `emotion` then there's no direct impact on Forma.

```js
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Button } from '@contentful/forma-36-react-components';

const hugeButtonStyle = css`
  width: 1000px;
  height: 1000px;
  margin: ${tokens.spacing2Xl};
`;

<Button extraClassNames={hugeButtonStyle}>Click me</Button>;
```

If we go with React-specific version of `emotion` than it would be really nice to do a breaking change and rename `extraClassNames` to `className`:

```js
// without breaking change in Forma36
import { jsx, ClassNames } from '@emotion/core';
import tokens from '@contentful/forma-36-tokens';
import { Button } from '@contentful/forma-36-react-components';

<ClassNames>
  {({ cx, css }) => {
    const hugeButtonStyle = css`
      width: 1000px;
      height: 1000px;
      margin: ${tokens.spacing2Xl};
    `;
    return <Button extraClassNames={cx(hugeButtonStyle)}>Click me!</Button>;
  }}
</ClassNames>;

// after breaking change in Forma36
const hugeButtonStyle = css`
  width: 1000px;
  height: 1000px;
  margin: ${tokens.spacing2Xl};
`;

<Button css={hugeButtonStyle}>Click me!</Button>;
```

**Note**: this breaking change in Forma36 is likely to happen no matter what desicion we make here.

### Impact on bundle size

The framework agnostic [`emotion@10.0.7` is `5.7kB` gzipped](https://bundlephobia.com/result?p=emotion@10.0.7).
This should add ~0.03% to our `libs` bundle. Given that this is the successor for stylus, we can save space
by getting rid of styles there and by discovering and removing unused styles when migrating them to emotion.

### Impact on caching

Given that styles written using emotion will be bundled with the application javascript, they won't be
separately cachable. `vendor` and stylus based `application` styles will continue to be cached as they are now.

### Open questions

- v10 or framework agnostic?
- template strings or object notation for styles or both?
