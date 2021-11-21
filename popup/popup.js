class ApplicationOptionModel extends Seemple.Object {
  constructor(data, extra, elementIndex) {
    super(data);
    this.on('render', () => {
      this.bindNode({ name: ':sandbox' }, Seemple.binders.html())
      this.bindNode('optionValue', ':sandbox', Seemple.binders.attr('value'))
      this.optionValue = elementIndex
    });
  }
}

class ApplicationArray extends Seemple.Array {
  itemRenderer = '<option>';
  get Model() { return ApplicationOptionModel }
  constructor() {
    // sandbox definition
    super().bindNode('sandbox', '#selectApplication');
  }
};

class Application extends Seemple {
  constructor(settings) {
    super()
    this.sending = false

    this.instantiate('applicationList', ApplicationArray)
      .bindNode('applicationIndex', '#selectApplication')

    this.applicationList = settings.applications
    this.applicationIndex = settings.selectedApplicationIndex

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
    this.bindNode('popupTitle', '#popupTitle', Seemple.binders.className('hide', false))

    /** 
     * If there are no settings saved don't show the send message popup
     */
    this.settingsMissing = this.messageArea = this.popupTitle = settings.applications.length > 0
    if (this.settingsMissing) {
      this.selectPriority = settings.applications[this.applicationIndex].priority
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
      this.sendMessage(this.applicationIndex, this.inputTitle, this.inputContent, this.selectPriority)
    })

    this.on('change:sending', () => {
      this.spanSend = this.spanSending = this.buttonSend = this.sending
    })

    this.on('change:applicationIndex', () => {
      this.selectPriority = settings.applications[this.applicationIndex].priority
    })
    
  }

  sendMessage(applicationIndex, title, message, priority) {
    this.sending = true
    return browser.runtime.sendMessage({
      method: "sendMessage",
      value: {
        message: message,
        title: title,
        priority: priority,
        applicationIndex: applicationIndex
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
    error => console.log(`Error: ${error}`))
}

getSettings()
