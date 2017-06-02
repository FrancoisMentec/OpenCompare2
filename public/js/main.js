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
      alert('for import instruction check the github')
    }
  } else {
    var popup = new Popup('Import', 'import content', {'import': function () {
      popup.hide()
    }})
    popup.show()
    /*var r = new XMLHttpRequest()
    r.open('POST', '/import', true)
    var formData = new FormData()
    formData.append('file', file)
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return
      console.log(r.responseText)
    }
    r.send(formData)*/
  }
}

function initDrop () {
  importZone = document.getElementById('importZone')

  document.body.addEventListener('dragenter', function (e) {
    e.preventDefault()
    importZone.className = 'dragover'
  })

  importZone.addEventListener('dragover', function (e) {
    e.preventDefault()
  })

  importZone.addEventListener('dragleave', function (e) {
    e.preventDefault()
    importZone.className = ''
  })

  importZone.addEventListener('drop', function (e) {
    e.preventDefault()
    importZone.className = ''
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
