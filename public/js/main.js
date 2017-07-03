function search () {
  window.location = '/search/' + encodeURIComponent($('#searchInput').val())
}

function searchKeyPress (event) {
  if (event.keyCode === 13) {
    search()
  }
}

function importPCM (file = false) {
  if (!file) {
    var val = $('#searchInput').val()
    if (val.length > 0) {
      $('#importLoading').fadeIn()
      window.location = '/import/' + encodeURIComponent(val)
    } else {
      var popup = new Popup('Import instruction',
        'For import instructions check <a href="https://github.com/FrancoisMentec/OpenCompare2#import-data">GitHub</a>.',
        {'OK': function () { popup.delete() }})
      popup.show()
    }
  } else {
    var importContent = document.createElement('div')
    var importName = new TextField('Name')
    importName.appendTo(importContent)
    importName.value = (res = /(.*)\.[^\.]*/.exec(file.name))
      ? res[1]
      : file.name
    var importSource = new TextField('Source')
    importSource.appendTo(importContent)
    importSource.value = file.name
    var importAuthor = new TextField('Author')
    importAuthor.appendTo(importContent)
    var importLicense = new TextField('License')
    importLicense.appendTo(importContent)
    var importDescription = new TextField('Description', 'area')
    importDescription.appendTo(importContent)
    var errorDiv = document.createElement('div')
    errorDiv.className = 'textError'
    importContent.appendChild(errorDiv)
    var importPopup = new Popup('Import', importContent, {'CANCEL': function () {
      importPopup.delete()
    }, 'IMPORT': function () {
      $('#importLoading').fadeIn()
      var r = new XMLHttpRequest()
      r.open('POST', '/import', true)
      var formData = new FormData()
      formData.append('file', file)
      formData.append('name', importName.value)
      formData.append('source', importSource.value)
      formData.append('author', importAuthor.value)
      formData.append('license', importLicense.value)
      formData.append('description', importDescription.value)
      r.onreadystatechange = function () {
        if (r.readyState != 4 || r.status != 200) return
        var res = JSON.parse(r.responseText)
        if (res.error) {
          $('#importLoading').fadeOut()
          if (typeof res.error === 'string') {
            errorDiv.innerHTML = res.error
          } else {
            console.error(res.error)
            errorDiv.innerHTML = typeof res.error.message === 'string'
              ? res.error.message
              : 'An error that can\'t be displayed here occured, check the console (Ctrl+Shift+I).'
          }
        } else if (res.pcm) {
          window.location = '/pcm/' + res.pcm
        } else {
		  $('#importLoading').fadeOut()
		  errorDiv.innerHTML = 'Wtf error check console'
		  console.log(res)
		}
      }
      r.send(formData)
    }})
    importPopup.show()
  }
}

var createPCMPopup = null
function createPCM () {
  if (!createPCMPopup) {
    var createPCMContent = document.createElement('div')
    var createPCMName = new TextField('Name')
    createPCMName.appendTo(createPCMContent)
    var createPCMSource = new TextField('Source')
    createPCMSource.appendTo(createPCMContent)
    var createPCMAuthor = new TextField('Author')
    createPCMAuthor.appendTo(createPCMContent)
    var createPCMLicense = new TextField('License')
    createPCMLicense.appendTo(createPCMContent)
    var createPCMDescription = new TextField('Description', 'area')
    createPCMDescription.appendTo(createPCMContent)
    var createPCMError = document.createElement('div')
    createPCMError.className = 'textError'
    createPCMContent.appendChild(createPCMError)
    createPCMPopup = new Popup('Create', createPCMContent, {
      'CANCEL': function () {
        createPCMPopup.hide()
      },
      'OK': function () {
        var r = new XMLHttpRequest()
        r.open('POST', '/create', true)
        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        r.onreadystatechange = function () {
          if (r.readyState != 4 || r.status != 200) return
          var res = JSON.parse(r.responseText)
          if (res.error) {
            createPCMError.innerHTML = res.error
          } else {
            window.location = '/pcm/' + res.pcm
          }
        }
        r.send('name=' + encodeURIComponent(createPCMName.value) +
          '&source=' + encodeURIComponent(createPCMSource.value) +
          '&author=' + encodeURIComponent(createPCMAuthor.value) +
          '&license=' + encodeURIComponent(createPCMLicense.value) +
          '&description=' + encodeURIComponent(createPCMDescription.value))
      }
    })
  }
  createPCMPopup.show()
}

function initDrop () {
  importDiv = document.getElementById('importDiv')
  importZone = document.getElementById('importZone')

  document.body.addEventListener('dragenter', function (e) {
    e.preventDefault()
    $(importDiv).fadeIn()
  })

  importZone.addEventListener('dragover', function (e) {
    e.preventDefault()
  })

  importZone.addEventListener('dragleave', function (e) {
    e.preventDefault()
    importZone.className = ''
    $(importDiv).fadeOut()
  })

  importZone.addEventListener('drop', function (e) {
    e.preventDefault()
    $(importDiv).fadeOut()
    //console.log(e)
    var dt = e.dataTransfer
    if (dt.items[0]) {
      if (dt.items[0].kind === 'file') {
        importPCM(dt.items[0].getAsFile())
      } else {
        alert('can only import file via drag and drop (check github for further instructions)')
      }
    } else if (dt.files[0]) {
      importPCM(dt.files[0])
    }
  })
}

// Add a feed back button to the body
function addFeedbackButton () {
  var feedBackButton = document.createElement('button')
  feedBackButton.setAttribute('id', 'feedbackButton')
  feedBackButton.innerHTML = 'feedback'
  feedBackButton.addEventListener('click', function () {
    var feedbackBody = encodeURIComponent('\n\n\n>**Informations :**\n>source: [' + window.location + '](' + window.location + ')')
    var feedBackPopup = new Popup('Feedback', 'There is no built-in feedback system, we\'re using github instead. ' +
      'So you need to create a github account, it\'s not a big deal, and it make feedback management easier. Thank you for your understanding.<br><br>' +
      '<a href="https://github.com/FrancoisMentec/OpenCompare2/issues/new?labels=feedback&body=' + feedbackBody + '" target="_blank">Submit a feedback</a> or ' +
      '<a href="https://github.com/FrancoisMentec/OpenCompare2/issues/new?labels=bug&body=' + feedbackBody + '" target="_blank">report a bug.</a><br><br>' +
      'Thank you, your feedback is greatly appreciated.',
      {
        'OK': function () {
          feedBackPopup.delete()
        }
      })
    feedBackPopup.show()
  })
  document.body.appendChild(feedBackButton)
}

window.onload = function () {
  addFeedbackButton()
}
