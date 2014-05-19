module GatekeeperHelper
  def plan_row(plan_name)
    find(:xpath, "//div[@class=\"plan-big-row\" and contains(text(), \"#{plan_name}\")]/../..")
  end

  def choose_plan(plan_name)
    find(:xpath, "//div[@class=\"plan-big-row\" and contains(text(), \"#{plan_name}\")]/../../*/a").click
  end

  def choose_organization(organization_name)
    find(:xpath, "//h3/a[contains(@href, 'organization') and contains(text(), '#{organization_name}')]").click
  end

  def reset_system
    unless ENV['USE_QUIRELY']
      raise "Aborted. Does not run locally. Run specs with USE_QUIRELY environment variable set"
    end
    uri = URI.parse("https://reset.quirely.com/123abc")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    request = Net::HTTP::Get.new(uri.request_uri)
    http.request(request)
    clear_access_token
  end

  def delete_organizations
    visit "#{app_host}/account/profile/organization_memberships"
    tab_iframe do
      find('.result-list')
      org_names = all(:xpath, '//tr/td[1]').map { |node| node.text }
      return if org_names[0] == 'There are no Organizations.'
      org_names.each do |org_name|
        choose_organization org_name
        click_link 'Close Organization'
        click_button 'Close Organization'
      end
      expect(page).to have_text('There are no Organizations')
    end
  end

  def create_organization(name)
    visit "#{app_host}/account/profile/organization_memberships"
    tab_iframe do
      click_link 'New Organization'
      fill_in 'organization_name', with: name
      click_button 'Create Organization'
    end
    expect_success 'Organization'
  end
end
