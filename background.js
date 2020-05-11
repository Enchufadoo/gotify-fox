const DEFAULT_PRIORITY = 1

const sendMessage = function (data) {
  return new Promise(() => {
    browser.storage.local.get().then((settings) => {
      const url = settings.url + '/message?token=' + settings.token
      return $.ajax({
        method: 'POST',
        data: {
          title: data.title,
          message: data.message,
          priority: data.priority
        },
        url: url
      }).then((data) => {
        chrome.runtime.sendMessage({
          method: "messageSent",
          value: data
        })
      }).catch(data => {

        let error = ''

        if (data.responseJSON) {
          error = `${data.responseJSON.error}: ${data.responseJSON.errorDescription}`
        } else if (data.status) {
          error = `${data.status}: ${data.statusText}`
        } else {
          error = "Unkown error"
        }
        chrome.runtime.sendMessage({
          method: "messageError",
          value: error
        })
      })
    })
  })

}

const saveSettings = function (settings) {
  return browser.storage.local.set({
    "url": settings.url,
    "token": settings.token,
    "priority": settings.priority
  })
}

const getSettings = function () {
  return new Promise((resolve) => {
    browser.storage.local.get().then((settings) => {
      settings.url = settings.url ? settings.url : ''
      settings.token = settings.token ? settings.token : ''
      settings.priority = settings.priority ? settings.priority : DEFAULT_PRIORITY
      resolve(settings)
    })
  })
}

browser.runtime.onMessage.addListener((message, sender, returnResponse) => {
  switch (message.method) {
    case "sendMessage":
      return returnResponse(sendMessage(message.value))
    case "saveSettings":
      return saveSettings(message.value)
    case "getSettings":
      return getSettings(message.value)
  }
})