if defined?(AssetSync)
  AssetSync.configure do |config|
    config_file = File.join(Rails.root, 'config', 'environments', Rails.env, 'config.json')
    json_config = JSON.parse(File.read(config_file))
    config.fog_provider = json_config['fog']['s3']['options']['provider']
    config.aws_access_key_id = json_config['fog']['s3']['options']['aws_access_key_id']
    config.aws_secret_access_key = json_config['fog']['s3']['options']['aws_secret_access_key']
    config.fog_directory = json_config['fog']['s3']['asset_sync']['bucket']

    # Increase upload performance by configuring your region
    config.fog_region = json_config['fog']['s3']['asset_sync']['region']
    #
    # Don't delete files from the store
    config.existing_remote_files = "keep"
    #
    # Automatically replace files with their equivalent gzip compressed version
    config.gzip_compression = true
    #
    # Use the Rails generated 'manifest.yml' file to produce the list of files to
    # upload instead of searching the assets directory.
    config.manifest = true
    #
    # Fail silently.  Useful for environments such as Heroku
    config.fail_silently = false

    # config.ignored_files = []
  end
end
