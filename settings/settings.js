class Settings extends Seemple {

  constructor(settings) {
    super()
  }
}

const getSettings = function () {
  return browser.runtime.sendMessage({
    method: "getSettings",
  }).then(
    (settings) => {
      new Settings(settings)
    },
    error => {
      console.log(`Error: ${error}`)
    })
}

getSettings()

