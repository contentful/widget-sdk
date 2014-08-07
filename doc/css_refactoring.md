# CSS refactoring

## File structure

Listed by lower to higher level:

- **base**: base styles and variables
- **mixins**: standalone mixins
- **utils**: generic utility classes
- **vendor**: vendor components
- **objects**: visual objects, with no further hierarchy below them
- **modules**: modules composed by visual objects, with some level of
  hierarchy
- **layouts**: layouts for pages or modules (not composed of modules)

## Refactoring plan

- Set up some tests with webdrivercss
- Set up a styleguide with node-kss
- Split base and mixins into directories
- Decrease nesting overall, component by component
- Move all mixins with no parameters to classes
- Get rid of any duplication of class definitions
- Remove use of very generic element selectors
- Split components.css into objects and/or modules
- Split components/* into modules
- Split components/tabs/* into modules and/or layouts
- Split forms into components and/or objects
- Split tabs/* into layouts/components
- Follow http://alistapart.com/article/creating-style-guides to build a
  styleguide
- Follow http://alistapart.com/article/creating-style-guides to
  standardize font size usage
- Gradually add things to the styleguide
- Stop using the formtastic default CSS on gatekeeper
- Add more classes to the generated formtastic forms to allow for better
  styling
  - http://rdoc.info/github/justinfrench/formtastic#Usage
  - :input_html => { :class => 'autogrow' }
  - :button_html => { :class => "primary" }

More to come

- get some statistics:
  - current size of css
  - current number of selectors in compiled css

# Reference links
- https://smacss.com/
- http://www.slideshare.net/spirosmartzoukos/lessons-learnt-from-the-fontshop-site-relaunch (slide 6)
- http://www.edenspiekermann.com/blog/oocss-and-the-pagification-of-modules
- http://nicolasgallagher.com/about-html-semantics-front-end-architecture/
- http://philipwalton.com/articles/css-architecture/
- https://medium.com/@drublic/css-naming-conventions-less-rules-more-fun-12af220e949b
- http://csswizardry.com/2014/01/extending-silent-classes-in-sass/
- https://github.com/csswizardry/inuit.css
- http://mdo.github.io/code-guide/
- https://github.com/csswizardry/CSS-Guidelines

## Styleguides
- https://pinboard.in/u:trodrigues/t:styleguide/
- http://alistapart.com/article/creating-style-guides
- http://css-tricks.com/design-systems-building-future/
- http://css-tricks.com/css-style-guides/
- http://patternlab.io/
- http://clearleft.com/thinks/onpatternportfolios/
- https://github.com/filamentgroup/X-rayHTML
- http://warpspire.com/posts/kss/

## Clean unused CSS
- Also check browser tools
- http://addyosmani.com/blog/removing-unused-css/
- http://davidwalsh.name/uncss
- https://github.com/geuis/helium-css

## Others
- http://css-tricks.com/rems-ems/
- Maybe helpful to write some scripts to help with something: https://www.npmjs.org/package/cssparser
- http://csslint.net/

