class ApplicationOptionModel extends Seemple.Object {
  constructor(data, parent, elementIndex) {
    super(data)
    this.on('render', () => {
      this.bindNode({ name: ':sandbox .application-name' }, Seemple.binders.html())
      this.bindNode({ url: ':sandbox .application-url' }, Seemple.binders.html())
      this.bindNode('optionValue', ':sandbox', Seemple.binders.attr('value'))
      this.bindNode('editRef', ':sandbox .button-edit', Seemple.binders.attr('href'))
      this.bindNode('buttonDelete', ':sandbox .button-delete')


      this.editRef = '../applications/applications.html?id=' + elementIndex

      this.on('click::buttonDelete', (event) => {
        event.preventDefault()
        parent.parent.deleteApplication(elementIndex)
      })

      this.optionValue = elementIndex
    })
  }
}

class ApplicationArray extends Seemple.Array {
  itemRenderer = `
  <div class="mr-4">
    <div class="application-name"></div>
    <div class="application-url"></div>
    <div class="d-flex justify-content-between">
      <div>
        <a class="button-edit" href="#"><i class="fa fa-edit" aria-hidden="true"></i> Edit</a>
      </div>
      <div><a class="button-delete" href="#"><i class="fa fa-times" aria-hidden="true"></i> Delete</a></div>
    </div>
    <hr />
  </div>
  `

  get Model() {
    return ApplicationOptionModel
  }

  constructor(data, parent) {
    super(data)
    this.bindNode('sandbox', '#applicationsDiv')
    this.set({ parent })
  }
}


class ManageApplications extends Seemple {
  constructor(settings) {
    super()

    this.instantiate('applicationList', ApplicationArray)
      .bindNode('applicationIndex', '#applicationsDiv')

    this.bindNode('settingsMissing', '#settingsMissing', Seemple.binders.className('hide'))



    this.applicationList = settings.applications

    this.settingsMissing = settings.applications.length > 0

    this.bindNode('sandbox', '.popup-body')
  }

  /**
   * Deletes an application based on the index in the applications list 
   * if there are no more applications redirects to the base popup 
   * and shows the "create an application message"
   * 
   * @param {*} applicationIndex 
   */
  deleteApplication(applicationIndex) {
    browser.runtime.sendMessage({
      method: "deleteApplication",
      value: applicationIndex
    }).then(
      (settings) => {
        if (settings.applications == 0) {
          window.location = '../popup/popup.html'
        } else {
          this.applicationList = settings.applications
        }
      },
      error => console.log(`Error: ${error}`))
  }
}


const getSettings = function () {
  return browser.runtime.sendMessage({
    method: "getSettings",
  }).then(
    (settings) => {
      new ManageApplications(settings)
    },
    error => console.log(`Error: ${error}`))
}

getSettings()
