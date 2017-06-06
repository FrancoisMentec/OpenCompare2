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
    var importDescription = new TextField('Description', true)
    importDescription.appendTo(importContent)
    var errorDiv = document.createElement('div')
    errorDiv.className = 'textError'
    importContent.appendChild(errorDiv)
    var importPopup = new Popup('Import', importContent, {'CANCEL': function () {
      importPopup.delete()
    }, 'IMPORT': function () {
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
          errorDiv.innerHTML = res.error
        } else {
          window.location = '/pcm/' + res.pcm
        }
      }
      r.send(formData)
    }})
    importPopup.show()
  }
}

function initDrop () {
  importZone = document.getElementById('importZone')

  document.body.addEventListener('dragenter', function (e) {
    e.preventDefault()
    importZone.className = 'dragover'
    $(importZone).fadeIn()
  })

  importZone.addEventListener('dragover', function (e) {
    e.preventDefault()
  })

  importZone.addEventListener('dragleave', function (e) {
    e.preventDefault()
    importZone.className = ''
    $(importZone).fadeOut()
  })

  importZone.addEventListener('drop', function (e) {
    e.preventDefault()
    importZone.className = ''
    $(importZone).fadeOut()
    console.log(e)
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
