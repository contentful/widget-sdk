require 'spec_helper'

feature 'The app', js: true do
  before do
    visit '/#access_token=b1f4de0475ec235025f214faffd86b6f7f640fb89da660247bc650ad7851ebca'
  end
  scenario 'should load' do
    page.should have_selector 'space-view'
  end
end

feature 'Creating a space', js: true do
  before do
    visit '/#access_token=b1f4de0475ec235025f214faffd86b6f7f640fb89da660247bc650ad7851ebca'
  end

  scenario 'creating the space' do
    within 'nav.account .project' do
      find('.dropdown-toggle').click
      all('li').last.click
    end
    within 'form[name=newSpaceForm]' do
      fill_in 'name', with: 'TestSpace'
      fill_in 'locale', with: 'en-US'
      click_button 'Create Space'
    end
    sleep 2
    within '.nav-bar' do
      all('li').last.click
    end
    within_frame 0 do
      all('a').find{|a| a[:'data-method'] == 'delete'}.click
      page.driver.browser.switch_to.alert.accept
    end
    sleep 2
  end
end
