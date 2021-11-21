const DEFAULT_PRIORITY = 1

class Settings {
  constructor() {
    this.applications = []
    this.scriptInitialized = false
    this.selectedApplicationIndex = 0
  }
}

let extSettings = new Settings()

const loadSettings = function () {
  return browser.storage.local.get().then(function (settings) {
    extSettings.scriptInitialized = true
    extSettings.applications = settings.applications ?? []
    extSettings.selectedApplicationIndex = settings.selectedApplicationIndex ?? 0
  })
}

/**
 * Sends the message to the currently selected application 
 * @todo improve the unknown error response
 * @param {*} data 
 * @returns 
 */
const sendMessage = function (data) {
  return new Promise(() => {

    browser.storage.local.set({
      "selectedApplicationIndex": data.applicationIndex
    })

    browser.storage.local.get().then((settings) => {
      const app = settings.applications[data.applicationIndex]
      const url = app.url + '/message?token=' + app.token
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

/**
 * Creates a new application, if the applicationIndex key is present it updates
 * the values of a saved application
 * @param {*} data 
 * @returns 
 */
const saveApplication = function (data) {
  let applications = extSettings.applications
  if (data.applicationIndex) {
    applications[data.applicationIndex] = data
  } else {
    applications.push(data)
  }

  extSettings.applications = applications

  return browser.storage.local.set({
    "applications": applications
  })
}

/**
 * Deletes an application 
 * @param {*} applicationIndex 
 * @returns 
 */
const deleteApplication = function (applicationIndex) {

  extSettings.applications.splice(applicationIndex, 1)

  return new Promise((resolve) => {
    return browser.storage.local.set({
      "applications": extSettings.applications
    }).then(() => {
      resolve(extSettings)
    })
  })
}



const getSettings = function () {
  return new Promise((resolve) => {
    browser.storage.local.get().then((settings) => {
      settings.selectedApplicationIndex = settings.selectedApplicationIndex ?? 0
      settings.applications = settings.applications ?? []
      resolve(settings)
    })
  })
}

browser.runtime.onMessage.addListener((message, sender, returnResponse) => {
  switch (message.method) {
    case "sendMessage":
      return returnResponse(sendMessage(message.value))
    case "saveApplication":
      return saveApplication(message.value)
    case "getSettings":
      return getSettings(message.value)
    case "deleteApplication":
      return deleteApplication(message.value)
  }
})

if (!extSettings.scriptInitialized) {
  loadSettings()
}