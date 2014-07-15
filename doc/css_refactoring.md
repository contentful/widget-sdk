# CSS refactoring

Come up with a more structured plan for this.

Some main points:
- get rid of complex selectors
- get rid of nesting
- remove duplication where possible
- get rid of class declarations spread out across different files and different points in files
- Adopt an atomic structure and naming conventions
  - http://www.slideshare.net/spirosmartzoukos/lessons-learnt-from-the-fontshop-site-relaunch (slide 6)
  - http://nicolasgallagher.com/about-html-semantics-front-end-architecture/
  - http://philipwalton.com/articles/css-architecture/
  - https://medium.com/@drublic/css-naming-conventions-less-rules-more-fun-12af220e949b
  - http://www.smashingmagazine.com/2013/08/02/other-interface-atomic-design-sass/
  - http://www.smashingmagazine.com/2011/12/12/an-introduction-to-object-oriented-css-oocss/
  - http://mdo.github.io/code-guide/
  - https://github.com/csswizardry/CSS-Guidelines
- create a styleguide, together with a better naming scheme for different CSS blocks
  - https://pinboard.in/u:trodrigues/t:styleguide/
  - http://alistapart.com/article/creating-style-guides
  - http://css-tricks.com/design-systems-building-future/
  - http://css-tricks.com/css-style-guides/
  - http://patternlab.io/
  - http://clearleft.com/thinks/onpatternportfolios/
  - https://github.com/filamentgroup/X-rayHTML
  - http://warpspire.com/posts/kss/
- Clean unused CSS
  - http://addyosmani.com/blog/removing-unused-css/
  - http://davidwalsh.name/uncss
  - https://github.com/geuis/helium-css
- http://css-tricks.com/rems-ems/
- Maybe helpful to write some scripts to help with something: https://www.npmjs.org/package/cssparser
