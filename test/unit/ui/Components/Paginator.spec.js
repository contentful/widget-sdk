import * as sinon from 'helpers/sinon';
import {h} from 'ui/Framework';
import paginator from 'ui/Components/Paginator';

describe('ui/Components/Paginator', () => {
  beforeEach(function () {
    this.view = this.createUI();
    this.select = sinon.spy();
    this.render = function (page, pageCount) {
      this.view.render(h('div', [paginator(this.select, page, pageCount)]));
    };
  });

  it('selects previous page', function () {
    this.render(3, 5);
    this.view.find('paginator.prev').click();
    sinon.assert.calledOnceWith(this.select, 2);
  });

  it('selects next page', function () {
    this.render(3, 5);
    this.view.find('paginator.next').click();
    sinon.assert.calledOnceWith(this.select, 4);
  });

  it('selects first page', function () {
    this.render(50, 100);
    this.view.find('paginator.select.0').click();
    sinon.assert.calledOnceWith(this.select, 0);
  });

  it('selects last page', function () {
    this.render(50, 100);
    this.view.find('paginator.select.99').click();
    sinon.assert.calledOnceWith(this.select, 99);
  });

  it('selects current page page', function () {
    this.render(50, 100);
    this.view.find('paginator.select.50').assertIsSelected();
  });

  it('is not shown if there is only one page', function () {
    this.render(50, 100);
    this.view.find('paginator').assertIsVisible();
    this.render(0, 1);
    this.view.find('paginator').assertNonExistent();
  });

  it('shows neighboring pages', function () {
    this.render(1, 100);
    assertPageLabels(this.view, [1, 2, 3, 4, 5, 6, '…', 100]);

    this.render(99, 100);
    assertPageLabels(this.view, [1, '…', 95, 96, 97, 98, 99, 100]);

    this.render(49, 100);
    assertPageLabels(this.view, [1, '…', 48, 49, 50, 51, 52, '…', 100]);
  });

  function assertPageLabels (view, labels) {
    view.find('paginator.pages').assertHasText(labels.join(''));
  }
});
