class Application extends Seemple {

  constructor(settings) {
    super()

    this.validUrl = false
    this.isInsidePopup = chrome.extension.getViews({ type: "popup" }).length > 0
    this.bindNode('sandbox', '.popup-body')
    this.bindNode('inputServerUrl', '#inputServerUrl')
    this.bindNode('inputToken', '#inputToken')
    this.bindNode('selectPriority', '#selectPriority')
    this.bindNode('tokenError', '#tokenError', Seemple.binders.html())
    this.bindNode('urlError', '#urlError', Seemple.binders.html())
    this.bindNode('buttonSaveSettings', '#buttonSaveSettings', Seemple.binders.className('disabled'))
    this.bindNode('contLinkCancel', '#contLinkCancel', Seemple.binders.className('hide'))
    this.bindNode('contLinkGoBack', '#contLinkGoBack', Seemple.binders.className('hide'))

    if (!this.isInsidePopup) {
      this.contLinkCancel = true
      this.contLinkGoBack = true
    }

    this.inputServerUrl = settings.url
    this.inputToken = settings.token
    this.selectPriority = settings.priority

    /**
     * Validate de input url
     */
    this.on('change:inputServerUrl', () => {
      this.validUrl = this.validateUrl(this.inputServerUrl)

      if (!this.inputServerUrl) {
        this.urlError = 'Server address missing'
      } else {
        if (!this.validUrl && this.inputServerUrl) {
          this.urlError = 'Invalid server address'
          this.nodes.inputServerUrl.classList.add('invalid-input')
        } else {
          this.urlError = ''
          this.nodes.inputServerUrl.classList.remove('invalid-input')
        }
      }
    })

    /**
     * Enable the save settings button if there are no errors and all the inputs 
     * are filled
     */
    this.calc('buttonSaveSettings', ['tokenError', 'urlError', 'inputToken', 'inputServerUrl'],
      (tokenError, urlError, inputToken, inputServerUrl) => {
        const res = ((tokenError.length > 0) && (urlError.length > 0)) ||
          (inputToken.length === 0 || inputServerUrl.length === 0)
        return res
      }
    )

    /**
     * Validate de token (not empty)
     */
    this.on('change:inputToken', () => {

      if (!this.inputToken) {
        this.nodes.inputToken.classList.add('invalid-input')
        this.tokenError = 'App token is missing'
      } else {
        this.nodes.inputToken.classList.remove('invalid-input')
        this.tokenError = ''
      }
    })

    this.on('click::buttonSaveSettings', (event) => {
      event.preventDefault()
      this.saveSettings(this.inputServerUrl, this.inputToken, this.selectPriority)
    })

  }

  /**
   * Crappy regex url validator
   */
  validateUrl(str) {
    let res = str.match(/^(http:\/\/|https:\/\/)+.+(\.[a-zA-Z0-9])?[\:]?[a-zA-Z0-9]+$/g)
    return res !== null
  }

  saveSettings(url, token, priority) {
    return browser.runtime.sendMessage({
      method: "saveSettings",
      value: { url: url, token: token, priority: priority }
    }).then(() => {
      if (this.isInsidePopup) {
        window.location = '../popup/popup.html'
      }
    })
  }
}

const getSettings = function () {
  return browser.runtime.sendMessage({
    method: "getSettings",
  }).then(
    (settings) => {
      new Application(settings)
    },
    error => {
      console.log(`Error: ${error}`)
    })
}

getSettings()

