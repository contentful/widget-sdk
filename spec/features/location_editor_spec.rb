require 'spec_helper'

feature 'Location Editor', js: true, sauce: true do
  include ContentTypeHelper
  include EditorHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Working with a location' do
    create_content_type
    add_button 'Entry with Location'
    edit_field 'locationField' do
      # Add by click
      page.execute_script("google.maps.event.trigger($('.gmaps-container').scope()._getMap(), 'click', {latLng: new google.maps.LatLng(51, 9)})")
      find('.lat').value.should == '51'
      find('.lon').value.should == '9'
      # Search
      find('input[type="search"]').set('Berlin')
      find('li.selected').click
      find('.lat').value[0..4].should == '52.52'
      find('.lon').value[0..4].should == '13.40'
      # Remove
      find('.remove-location').click
      find('.lat').value.should be_blank
      find('.lon').value.should be_blank
      page.should_not have_selector(:xpath, "//img[contains(@src, 'spotlight')]")
      # Add by entering
      find('.lat').set '50'
      find('.lon').set '8'
      page.should have_selector(:xpath, "//img[contains(@src, 'spotlight')]")
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
  end

  def create_content_type
    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Entry with Location'
    add_field 'Location Field', 'Location'
    wait_for_sharejs
    click_button 'Activate'
    close_tab
  end
end
