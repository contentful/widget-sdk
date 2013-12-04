require 'spec_helper'

feature 'Working with spaces', js: true, sauce: true do
  before do
    ensure_login
  end

  scenario 'creating and deleting a space' do
    within 'nav.account .project' do
      find('.dropdown-toggle').click
      all('li').last.click
    end
    within 'form[name=newSpaceForm]' do
      fill_in 'name', with: test_space
      fill_in 'locale', with: 'en-US'
      click_button 'Create Space'
    end
    page.has_no_css? 'form[name=newSpaceForm]'
    within '.nav-bar' do
      all('li').last.click
    end
    tab_iframe do
      click_link 'Delete Space'
      accept_browser_dialog
    end
    sleep 2
  end

  scenario 'Renaming a space' do
    remove_test_space
    create_test_space
    nav_bar 'space-settings'
    tab_iframe do
      fill_in 'space_name', with: "Renamed #{test_space}"
      click_button 'Update Space'
    end
    expect(find('.account .project .dropdown-toggle')).to have_content "Renamed #{test_space}"
    remove_test_space "Renamed #{test_space}"
  end
end
