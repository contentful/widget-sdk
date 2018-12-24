'use strict';

import _ from 'lodash';

describe('cfContentTypePreview directive', () => {
  beforeEach(
    module('contentful/test', $provide => {
      const contentTypePreview = sinon.stub();
      contentTypePreview.fromData = sinon.stub();
      $provide.constant('contentTypePreview', contentTypePreview);
    })
  );

  beforeEach(function() {
    this.getPreview = this.$inject('contentTypePreview');
    this.getPreview.fromData.returns(this.when('DUMMY PREVIEW'));

    this.element = this.$compile('<cf-content-type-preview>', {
      contentType: { data: { sys: { publishedVersion: false } } },
      actions: { save: this.$inject('command').create(_.noop) }
    });
    this.scope = this.element.scope();
  });

  it('shows notification and dummy data for unsaved content type', function() {
    expect(this.scope.isNew).toBe(true);
    expect(this.element.text()).toMatch('DUMMY PREVIEW');
  });

  it('fetches and display preview data when content type is saved', function() {
    this.getPreview.reset();
    this.scope.contentType.data.sys.publishedVersion = 2;
    this.getPreview.returns(this.when('SERVER DATA'));
    this.$apply();

    sinon.assert.calledOnce(this.getPreview);
    expect(this.scope.isNew).toBe(false);
    expect(this.element.text()).not.toMatch('DUMMY PREVIEW');
    expect(this.element.text()).toMatch('SERVER DATA');
  });
});
