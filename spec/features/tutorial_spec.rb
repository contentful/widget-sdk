require 'spec_helper'

feature 'Tutorial', js: true, non_ci: true do
  include ContentTypeHelper
  include EditorHelper
  include AssetHelper

  before do
    ensure_login
    remove_test_space 'Playground'
    create_test_space
  end

  after do
    remove_test_space 'Playground'
  end

  def open_tutorial_overview
    within 'nav.account .user' do
      find('.dropdown-toggle').click
      find('li', text: 'Start Tutorial').click
    end
    find('i.dot:last-child').click
  end

  def close_tutorial_overview
    find('#welcome .guiders_x_button').click
  end

  def finish_tutorial
    using_wait_time 20 do
      find('a', text: 'Back to tutorials overview menu')
      yield if block_given?
    end
    click_link 'Back to tutorials overview menu'
  end

  def run_content_type_tutorial
    find('.left.tutorial-select-box .take').click
    click_link 'Next'

    add_button 'Content Type'

    click_link 'Next' # Welcome

    fill_in 'contentTypeName', with: 'Blog Post'
    click_link 'Next' # Peace of Mind
    fill_in 'contentTypeDescription', with: 'Foobarbaz'

    add_field('Title', 'Text')
    6.times do # Second Row
      click_link 'Next'
      sleep 0.25
    end

    add_field('Body', 'Text')
    add_field('Timestamp', 'Date/Time')
    add_field('Image', 'Link to Asset')

    find('.publish').click

    find('#contentTypeList')
    nav_bar 'content-type-list'

    click_button 'Yes, please!'

    finish_tutorial do
      all('td.cell-name').should have(6).elements
    end
  end

  def run_entry_tutorial
    find('.middle.tutorial-select-box .take').click
    click_link 'Discover the Entry Editor'
    using_wait_time 20 do
      find('.guiders_title', text:'Meet the mighty Add button')
    end

    add_button 'Quiz Question'

    click_link 'Next'
    edit_field('question', 'en-US', 'textarea').set('Which CMS delivers content to web and native mobile applications?')
    click_link 'Next'
    edit_field('answer1', 'en-US', 'textarea').set('Wordpress')
    edit_field('answer2', 'en-US', 'textarea').set('Contentful')
    edit_field('answer3', 'en-US', 'textarea').set('Drupal')
    edit_field('answer4', 'en-US', 'textarea').set('Joomla')
    edit_field('correctAnswer', 'en-US', 'input').set('2')

    find '#entryAsset'
    edit_field('image', 'en-US', '.add-new').click
    find '#assetTitle'
    edit_field('title', 'en-US', 'input').set('Quiz Picture')
    find '#assetUpload'
    page.execute_script %Q{guiders.next()}
    set_asset('.asset-editor')
    find '#assetPick'
    page.execute_script %Q{guiders.next()}
    click_button 'Publish'

    find('.tab[data-view-type="entry-editor"]').click

    click_link 'Next'
    click_link 'Next'
    click_button 'Publish'

    nav_bar 'entry-list'

    click_button 'Yes, please!'

    finish_tutorial do
      all('td.cell-name').should have(11).elements
    end
  end

  def run_api_key_tutorial
    find('.right.tutorial-select-box .take').click
    click_link 'Next'
    add_button 'API Key'

    find('input[ng-model="apiKey.data.name"]').set 'Name'
    find('input[ng-model="apiKey.data.description"]').set 'Foobar'
    click_link 'Next'

    click_button 'Save'

    click_link 'Next'

    nav_bar 'api-key-list'
    finish_tutorial do
      all('td.cell-name').should have(1).element
    end
  end

  #scenario 'Run Content Type tutorial' do
    #open_tutorial_overview
    #run_content_type_tutorial
    #close_tutorial_overview
  #end

  #scenario 'Run Entry tutorial' do
    #open_tutorial_overview
    #run_entry_tutorial
    #close_tutorial_overview
  #end

  #scenario 'Run API Key tutorial' do
    #open_tutorial_overview
    #run_api_key_tutorial
    #close_tutorial_overview
  #end

  scenario 'Run all Tutorials' do
    open_tutorial_overview
    run_content_type_tutorial
    run_entry_tutorial
    run_api_key_tutorial
    close_tutorial_overview
  end

end
