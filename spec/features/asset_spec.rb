require 'spec_helper'

DEFAULT_LOCALE = 'en-US'
ASSET = {
  :fields => {
    :title => Hash[*[DEFAULT_LOCALE, 'Bacon']],
    :description => Hash[*[DEFAULT_LOCALE, 'So chunky and crispy']],
    :file => Hash[*[DEFAULT_LOCALE, {
      :contentType => 'image/jpeg',
      :fileName => 'example.jpg',
      :details => {
        :image => {
          :width => 333,
          :height => 300
        },
        :size => 17812
      },
      :url => "//images.joistio.com:8888/jvghydx4zq2t/4iX7NmIA0wsIWkGOmm2OWS/4871dd9962d7a6120696d984bf078b80/evilmonkey.jpg"
    }]],
  }
}

feature 'Asset Editor', js: true do
  include EditorHelper

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

    eval_scope '.asset-editor', "otDoc.at('fields').set(#{ASSET[:fields].to_json})"
    sleep 0.5
    eval_scope '.asset-editor', "otUpdateEntity()"
    apply_scope '.asset-editor'

    find '.file-info .thumbnail', wait: 10
    click_button 'Publish'
    sleep 1
    nav_bar 'asset-list'
    table = find('.main-results tbody')
    sleep 5
    expect(table).to have_text 'Bacon'
  end
end

feature 'Link Editor', js: true do
  include EditorHelper
  include ContentTypeHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
    create_asset
  end

  after do
    remove_test_space
  end

  scenario 'Add link to entry' do
    create_content_type
    add_button 'Entry with Link'
    edit_field 'assetField' do
      find('input').set 'Bacon'
      sleep 0.5
      find('.result-list tbody tr').click
    end
    click_button 'Publish'
    expect_success
  end

  def create_asset
    add_button 'Asset'
    edit_field('title', 'en-US', 'input').set 'Bacon'
    edit_field('description', 'en-US', 'textarea').set 'So chunky and crispy'

    eval_scope '.asset-editor', "otDoc.at('fields').set(#{ASSET[:fields].to_json})"
    sleep 0.5
    eval_scope '.asset-editor', "otUpdateEntity()"
    apply_scope '.asset-editor'

    find '.file-info .thumbnail', wait: 10
    click_button 'Publish'
    sleep 0.5
  end

  def create_content_type
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Entry with Link'
    fill_in 'contentTypeDescription', with: 'Test description'
    add_field 'Asset Field', 'Link to Asset'
    sleep 1
    click_button 'Activate'
    close_tab
  end

  scenario 'Adding two different files to an entry'
  scenario 'Make sure only assets can be selected'
end
