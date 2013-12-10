require 'spec_helper'

feature 'Asset Editor', js: true, sauce: true do
  include EditorHelper
  include AssetHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Creating a new Asset' do
    add_button 'Asset'
    edit_field('title', 'en-US', 'input').set 'Bacon'
    edit_field('description', 'en-US', 'textarea').set 'So chunky and crispy'

    set_asset('.asset-editor')

    find '.file-info .thumbnail', wait: 10
    click_button 'Publish'
    sleep 3
    nav_bar 'asset-list'
    table = find('.main-results tbody')
    expect(table).to have_text('Bacon')
  end
end

feature 'Link Editor', js: true, sauce: true do
  include EditorHelper
  include ContentTypeHelper
  include AssetHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Add link to entry' do
    create_asset
    create_content_type('Asset')
    add_button 'Entry with Asset'
    edit_field 'assetField' do
      find('input').set 'Bacon'
      sleep 0.5
      find('.result-list tbody tr').click
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
  end

  def create_asset
    add_button 'Asset'
    edit_field('title', 'en-US', 'input').set 'Bacon'
    edit_field('description', 'en-US', 'textarea').set 'So chunky and crispy'

    set_asset('.asset-editor')

    find '.file-info *[cf-thumbnail]', wait: 10
    click_button 'Publish'
    sleep 0.5
  end

  scenario 'Adding two different files to an entry'
  scenario 'Make sure only assets can be selected'
end
