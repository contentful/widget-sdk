# [UIEP-0002] CSS-in-JS using [emotion](https://emotion.sh)

## Motivation [Mudit]

Current state of styling in the web app is very fragmented.
We have a mix of inline styles and classes defined in our stylus files.
This leads to various problems arising from unclear precedence and css specificity.
It also makes it hard for us to de-duplicate CSS rules and identify + eliminate unused styles.

We propose switching to a CSS-in-JS solution that lets us have sane precedence (due to a saner
model around “Order of appearance”), dead-code elimination, co-location of styles and logic,
better dev ergonomics and simpler composability of rules.

**We specifically propose using [emotion](https://emotion.sh).**
This proposal evaluates both framework agnostic emotion and v10 which is a massive departure from v9.
The goal of this proposal is two-fold —

1. Decide on using emotion as our CSS-in-JS solution
2. Decide on which version of it we want to use (v10 or framework agnostic)

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

## Solutions looked at [Alex]

styled-components

emotion

CSS Modules

astoturf

JSS

## Chosen solution : Emotion

### Examples [Mudit]

Since emotion@v10 is a big departure from v9 and framework agnostic, it has a direct impact on
developer ergonomics and how you structure your code. Therefore, instead of static code snippets
as examples, codesandboxes are made available below for you to try out the variants. We hope
it’ll help you provide better feedback on this proposal.

#### V10

[![Edit emotion-react-v10](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/pmvy8y8vq)

#### Framework Agnostic

[![Edit emotion-framework-agnostic](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jlr25o5q3y)

### Dev experience wins [Mudit]

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
      <td>Generally used for object styles.</td>
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

### Trade-offs [Alex drafts & Mudit reviews]

### Migration path (can already use in new things) [Mudit drafts & Alex reviews]

### Impact on Jest snapshots [Mudit]

[jest-emotion](https://github.com/emotion-js/emotion/tree/master/packages/jest-emotion)

### Impact on Forma 36 [Alex]

### Impact on bundle size [Mudit]

### Impact on caching (no more css vs js caching) [Mudit]

### Impact on existing styles that will be shipped as-is (e.g., jquery ui, base .styl files, etc) [Mudit]
