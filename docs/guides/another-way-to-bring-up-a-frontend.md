### Another way to bring up a Frontend for development on Growth
* Add this to your ~/.zshrc
```bash
start_ui () {
        local env='dev-on-'
        if [[ "$1" == "cypress" ]]
        then
                env="localhost"
        elif [ -z "$1" ]
        then
                env="${env}preview"
        else
                env="${env}${1}"
        fi
        echo "Starting UI for environment ${env}\n"
        UI_CONFIG=$env npm start
}
```
* Add a bookmark in chrome
  * Go to bookmark manager in chrome, or press `option+command+b`
  * Click on the three dots in the upper right corner
  * Click `Add new bookmark`
  * Add these to the text fields
    * Name: `LocalDev` (or whatever else you'd like to call it)
    * Url: 
    ```
    javascript:window.location.href=`http://localhost:3001${window.location.pathname}#access_token=${window.sessionStorage.getItem('token')}`
    ```
  *  Click `save`

* If you haven't yet, run `git clone https://github.com/contentful/user_interface.git`
* run `cd user_interface/`
* run
  * `nvm use`
  * `npm login`
  * `npm install`
  * `start_ui()` (the command we added to our ~/.zshrc earlier)
* Navigate to [http://localhost:3001/](http://localhost:3001/)
* Click the `LocalDev` Bookmark we made earlier
* Develop away!
