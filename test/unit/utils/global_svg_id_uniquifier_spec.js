'use strict';

describe('globalSvgIdUniquifier.uniquifyIds()', function () {
  let uniquifyIds;

  beforeEach(function () {
    module('cf.utils');

    uniquifyIds = this.$inject('globalSvgIdUniquifier').uniquifyIds;
  });

  it('returns the same element as passed in', function () {
    const svgElem = svg('<path id="a" />');
    expect(uniquifyIds(svgElem)).toBe(svgElem);
  });

  const EXPECT_UNTOUCHED = {};
  /**
   * Keys serve as test descriptions. Values are supposed to be an array with
   * the first value containing a SVG's inner markup which will be passed into
   * `uniquifyIds()` while the second value is the expected output.
   */
  const TESTS = {
    'updates all `id` attribute values - adds a numeric suffix `0`': [`
        <path id="some-id" />
        <g id="b"></g>
      `, `
        <path id="cf-svg__some-id--0"></path>
        <g id="cf-svg__b--0"></g>
      `],
    'updates `xlink:href` attributes right to the referenced element': [`
        <path id="a" />
        <use xlink:href="#a" />
      `, `
        <path id="cf-svg__a--0" />
        <use xlink:href="#cf-svg__a--0" />
      `],
    'updates `link:href` attribute left to the referenced element': [`
        <use xlink:href="#a" />
        <path id="a" />
      `, `
        <use xlink:href="#cf-svg__a--0" />
        <path id="cf-svg__a--0" />
      `],
    'does not update `xlink:href` attribute if it references an unknown `id`': [`
        <use xlink:href="#foo" />
      `,
      EXPECT_UNTOUCHED],
    'does not update `xlink:href` attribute not referencing an `id`': [`
        <path id="foo" />
        <use xlink:href="foo" />
      `, `
        <path id="cf-svg__foo--0" />
        <use xlink:href="foo" />
      `],
    'updates `filter` attribute right to the referenced element': [`
        <filter id="brighten" />
        <path filter="url(#brighten)" />
      `, `
        <filter id="cf-svg__brighten--0" />
        <path filter="url(#cf-svg__brighten--0)" />
      `],
    'updates `filter` attribute left to the referenced element': [`
        <path filter="url(#brighten)" />
        <filter id="brighten" />
      `, `
        <path filter="url(#cf-svg__brighten--0)" />
        <filter id="cf-svg__brighten--0" />
      `],
    'does not update `filter` attribute if it references an unknown `id`': [`
        <path filter="url(#brighten)" />
      `,
      EXPECT_UNTOUCHED],
    'does not update `filter` attribute if it references another file': [`
        <filter id="brighten" />
        <path filter="url(file.html#brighten)" />
      `, `
        <filter id="cf-svg__brighten--0" />
        <path filter="url(file.html#brighten)" />
      `],
    'updates `mask` attribute right to the referenced element': [`
        <defs><mask id="x" /></defs>
        <g mask="url(#x)" />
      `, `
        <defs><mask id="cf-svg__x--0" /></defs>
        <g mask="url(#cf-svg__x--0)" />
      `],
    'updates `mask` attribute left to the referenced element': [`
        <g mask="url(#x)" />
        <defs><mask id="x" /></defs>
      `, `
        <g mask="url(#cf-svg__x--0)" />
        <defs><mask id="cf-svg__x--0" /></defs>
      `],
    'does not update `mask` attribute if it references an unknown `id`': [`
        <circle mask="url(#some-shape)" />
      `,
      EXPECT_UNTOUCHED],
    'does not update `mask` attribute if it references another file': [`
        <mask id="shape" />
        <circle filter="url(file.html#shape)" />
      `, `
        <mask id="cf-svg__shape--0" />
        <circle filter="url(file.html#shape)" />
      `],
    'updates all `id`s and all their different kind of references': [`
        <defs>
          <rect id="a" width="4" height="2" />
          <mask id="b" fill="white">
              <use xlink:href="#a" />
          </mask>
        </defs>
        <g mask="url(#b)">
          <use xlink:href="#a" />
        </g>
      `, `
        <defs>
          <rect id="cf-svg__a--0" width="4" height="2" />
          <mask id="cf-svg__b--0" fill="white">
              <use xlink:href="#cf-svg__a--0" />
          </mask>
        </defs>
        <g mask="url(#cf-svg__b--0)">
          <use xlink:href="#cf-svg__a--0" />
        </g>
      `]
  };

  _.forEach(TESTS, (test, msg) => {
    const svgMarkup = test[0];
    const expectedSvgMarkup = test[1] === EXPECT_UNTOUCHED ? test[0] : test[1];

    it(msg, function () {
      const uniquifiedSvg = uniquifyIds(svg(svgMarkup));
      expectEqualElements(uniquifiedSvg, svg(expectedSvgMarkup));
    });
  });

  describeSequentiallyPassing(
    'the same SVG with an `id` attribute two times',
    '<path id="a" />',
    '<path id="a" />', returnedSvg(
      'has an `id` attribute uniquified by incrementing its numeric suffix',
      '<path id=cf-svg__a--1 />'
    ));

  describeSequentiallyPassing(
    'SVGs with different `id` attributes',
    '<path id="a" />',
    '<path id="b" />', returnedSvg(
      'has suffix `0` for second `id` attribute introduced to the uniquifier',
      '<path id="cf-svg__b--0" />'
    ));

  describeSequentiallyPassing(
    'a second SVG which repeats one `id` and introduces a new one',
    '<path id="a" />',
    '<g id="b"><path id="a" /></g>', returnedSvg(
      'has suffix `0` for newly introduced `id` and `1` for the known one',
      '<g id="cf-svg__b--0"><path id="cf-svg__a--1" /></g>'
    ));

  describeSequentiallyPassing(
    'two SVGs with different `id`s, then one containing duplicates of both',
    '<path id="a" />',
    '<path id="b" />',
    '<g id="a"><g id="b"><path id="c" /></g></g>', returnedSvg(
      'has suffix `1` for both known ids',
      '<g id="cf-svg__a--1"><g id="cf-svg__b--1"><path id="cf-svg__c--0" /></g></g>'
    ));

  describeSequentiallyPassing(
    'a SVG with an element `#a` followed by SVGs referencing `#a` while they do not have any',
    '<path id="a" />',
    '<use xlink:href="#a" />', returnedSvgStaysUntouched(),
    '<path filter="url(#a)" />', returnedSvgStaysUntouched(),
    '<path mask="url(#a)" />', returnedSvgStaysUntouched());

  describeSequentiallyPassing(
    'a SVG with an element `#a` followed by SVGs, each supposed to reference their own `#a` element',
    '<filter id="a" />',
    '<filter id="a" /><use xlink:href="#a" />', returnedSvg(
      'has `xlink:href` attribute referencing element of the same SVG',
      '<filter id="cf-svg__a--1" /><use xlink:href="#cf-svg__a--1" />'
    ),
    '<filter id="a" /><path filter="url(#a)"/>', returnedSvg(
      'has `filter` attribute referencing element of the same SVG',
      '<filter id="cf-svg__a--2" /><path filter="url(#cf-svg__a--2)"/>'
    ),
    '<mask id="a" /><path mask="url(#a)" />', returnedSvg(
      'has `mask` attribute referencing `<mask/>` of the same SVG',
      '<mask id="cf-svg__a--3" /><path mask="url(#cf-svg__a--3)" />'
    ));

  /**
   * @param {string} msg
   * @param {...string|object} steps SVG markup (without outer `<svg/>` tag) to
   *        be passed into `uniquifyIds()`. Alternatively a callback supposed to
   *        contain a test (`it()`) making an assertion regarding the last
   *        `uniquifyIds()` call.
   */
  function describeSequentiallyPassing (msg, ...steps) {
    let uniquifySvgSteps = [];

    describe(`sequentially passing ${msg};`, () => {
      _.forEach(steps, handleStep);
    });

    function handleStep (step, i) {
      if (typeof step === 'string') {
        handleUniquifySvgStep(step);
      } else if (_.isFunction(step)) {
        handleExpectationStep(step);
      } else {
        throw new Error(
          `Unexpected \`describeSequentiallyPassing\` parameter #${i + 1}`);
      }
    }

    function handleUniquifySvgStep (svgMarkup) {
      uniquifySvgSteps.push(() => {
        const stepSvgClone = svg(svgMarkup);
        const returnedSvg = uniquifyIds(svg(svgMarkup));
        return { stepSvgClone, returnedSvg };
      });
    }

    function handleExpectationStep (expectation) {
      const stepsSoFar = uniquifySvgSteps.slice();
      describe(`${uniquifySvgSteps.length}. passed SVG`, function () {
        beforeEach(function () {
          this.lastStepResult = _.flow(stepsSoFar)();
        });
        expectation();
      });
    }
  }

  function returnedSvg (message, expectedReturnedSvgMarkup) {
    const expectedSvg = svg(expectedReturnedSvgMarkup);
    return () => {
      it(`results in uniquified SVG which ${message}`, function () {
        expectEqualElements(this.lastStepResult.returnedSvg, expectedSvg);
      });
    };
  }

  function returnedSvgStaysUntouched () {
    return () => {
      it('results in no changes on the provided SVG', function () {
        expectEqualElements(
          this.lastStepResult.returnedSvg, this.lastStepResult.stepSvgClone);
      });
    };
  }

  function expectEqualElements (elem1, elem2) {
    expect(elem1.outerHTML).toBe(elem2.outerHTML);
  }

  function svg (svgMarkup) {
    return $('<svg>').append($(`${svgMarkup}`)).get(0);
  }

});
