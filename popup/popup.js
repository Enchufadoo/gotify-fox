class Application extends Seemple {
  constructor(settings) {
    super()
    this.sending = false
    

    /**
     * Receive a message from the background script when the message succeeds or fails
     * @todo switch to same event
     */
    browser.runtime.onMessage.addListener((message) => {
      switch (message.method) {
        case "messageSent":
          window.setTimeout(() => { this.sending = false }, 400)
          break
        case "messageError":
          window.setTimeout(() => {

            this.sending = false
            this.errorMessage = true
            this.descErrorMessage = message.value
          }, 400)
          break
      }
    })

    this.bindNode('sandbox', '.popup-body')
    this.bindNode('buttonSend', '#buttonSend', Seemple.binders.className('disabled'))
    this.bindNode('spanSend', '#spanSend', Seemple.binders.className('hide'))
    this.bindNode('spanSending', '#spanSending', Seemple.binders.className('hide', false))
    this.bindNode('inputTitle', '#inputTitle')
    this.bindNode('inputContent', '#inputContent')
    this.bindNode('selectPriority', '#selectPriority')
    this.bindNode('messageArea', '#messageArea', Seemple.binders.className('hide', false))
    this.bindNode('settingsMissing', '#settingsMissing', Seemple.binders.className('hide'))
    this.bindNode('errorMessage', '#errorMessage', Seemple.binders.className('hide', false))
    this.bindNode('descErrorMessage', '#descErrorMessage', Seemple.binders.html())

    /**
     * If there are no settings saved don't show the send message popup
     */
    this.settingsMissing = this.messageArea = typeof settings.url !== 'undefined' && settings.url

    if (typeof settings.priority !== 'undefined') {
      this.selectPriority = settings.priority
    }

    /**
     * Show the send button if both fields are fileld
     */
    this.calc('buttonSend', ['inputTitle', 'inputContent'],
      (inputTitle, inputContent) => {
        return !(inputTitle.length && inputContent.length)
      }
    )

    this.on('click::buttonSend', (event) => {
      event.preventDefault()
      this.errorMessage = false
      this.sendMessage(this.inputTitle, this.inputContent, this.selectPriority)
    })

    this.on('change:sending', () => {
      this.spanSend = this.spanSending = this.buttonSend = this.sending
    })
  }

  sendMessage(title, message, priority) {
    this.sending = true
    return browser.runtime.sendMessage({
      method: "sendMessage",
      value: { message: message, title: title, priority: priority }
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
    error => console.log(`Error: ${error}`))
}

getSettings()
