class Application extends Seemple {

  constructor(settings, applicationIndex) {
    super()

    this.validUrl = false
    this.isInsidePopup = chrome.extension.getViews({ type: "popup" }).length > 0

    this.bindNode('sandbox', '.popup-body')
    this.bindNode('inputServerUrl', '#inputServerUrl')
    this.bindNode('inputToken', '#inputToken')
    this.bindNode('inputName', '#inputName')
    this.bindNode('selectPriority', '#selectPriority')
    this.bindNode('tokenError', '#tokenError', Seemple.binders.html())
    this.bindNode('urlError', '#urlError', Seemple.binders.html())
    this.bindNode('buttonAddAplication', '#buttonAddAplication', Seemple.binders.className('disabled'))
    this.bindNode('contLinkCancel', '#contLinkCancel', Seemple.binders.className('hide'))
    this.bindNode('contLinkGoBack', '#contLinkGoBack', Seemple.binders.className('hide'))
    this.bindNode('spanSendMessage', '#spanSendMessage', Seemple.binders.html())
    this.bindNode('popupTitle', '#popupTitle', Seemple.binders.html())
    this.bindNode('buttonCancel', '#buttonCancel', Seemple.binders.attr('href'))

    if (!this.isInsidePopup) {
      this.contLinkCancel = true
      this.contLinkGoBack = true
    }

    this.application = false
    this.applicationIndex = applicationIndex

    if (this.applicationIndex !== null) {
      this.application = settings.applications[this.applicationIndex]
      this.spanSendMessage = 'Save Changes'
      this.buttonCancel = '../manage_applications/manage_applications.html'
      this.popupTitle = 'Edit Application'

    }

    this.inputServerUrl = this.application.url ?? ''
    this.inputToken = this.application.token ?? ''
    this.inputName = this.application.name ?? ''
    this.selectPriority = this.application.priority ?? 1


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
    this.calc('buttonAddAplication', ['tokenError', 'urlError', 'inputToken', 'inputServerUrl', 'inputName'],
      (tokenError, urlError, inputToken, inputServerUrl, inputName) => {
        const res = ((tokenError.length > 0) && (urlError.length > 0)) ||
          (inputToken.length === 0 || inputServerUrl.length === 0 || inputName.length === 0)
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

    this.on('click::buttonAddAplication', (event) => {
      event.preventDefault()
      this.saveApplication(
        this.inputServerUrl,
        this.inputToken,
        this.selectPriority,
        this.inputName,
        this.application ? this.applicationIndex : false
      )
    })

    this.on('click::buttonGoBack', (event) => {
      event.preventDefault()
      window.history.back()
    })
  }

  /**
   * Crappy regex url validator
   */
  validateUrl(str) {
    let res = str.match(/^(http:\/\/|https:\/\/)+.+(\.[a-zA-Z0-9])?[\:]?[a-zA-Z0-9]+$/g)
    return res !== null
  }

  saveApplication(url, token, priority, name, applicationIndex) {
    return browser.runtime.sendMessage({
      method: "saveApplication",
      value: { url, token, priority, name, applicationIndex }
    }).then(() => {
      if (this.isInsidePopup) {
        window.location = applicationIndex !== false ? '../manage_applications/manage_applications.html' : '../popup/popup.html'
      }
    })
  }
}

const getSettings = function () {
  return browser.runtime.sendMessage({
    method: "getSettings",
  }).then(
    (settings) => {

      const url = new URL(document.URL)
      let applicationIndex = url.searchParams.get("id")

      new Application(settings, applicationIndex)
    },
    error => {
      console.log(`Error: ${error}`)
    })
}

getSettings()

