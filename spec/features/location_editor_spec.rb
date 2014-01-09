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
    create_content_type('Location')
    add_button 'Entry with Location'
    edit_field 'locationField' do
      # Add by click
      page.execute_script("google.maps.event.trigger($('.gmaps-container').scope()._getMap(), 'click', {latLng: new google.maps.LatLng(51, 9)})")
      expect(page).to have_selector(:xpath, "//img[contains(@src, 'spotlight')]")
      expect(find('.lat').value).to eq('51')
      expect(find('.lon').value).to eq('9')
      # Search
      find('input[type="search"]').set('Berlin')
      find('li.selected').click
      expect(find('.lat').value[0..4]).to eq('52.52')
      expect(find('.lon').value[0..4]).to eq('13.40')
      # Remove
      find('.remove-location').click
      expect(find('.lat').value).to be_blank
      expect(find('.lon').value).to be_blank
      expect(page).to_not have_selector(:xpath, "//img[contains(@src, 'spotlight')]")
      # Add by entering
      find('.lat').set '50'
      find('.lon').set '8'
      expect(page).to have_selector(:xpath, "//img[contains(@src, 'spotlight')]")
    end
    wait_for_sharejs
    click_button 'Publish'
    expect_success
  end

end
