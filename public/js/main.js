function search () {
  window.location = '/search/' + encodeURIComponent($('#searchInput').val())
}

function searchKeyPress (event) {
  if (event.keyCode === 13) {
    search()
  }
}

function importPCM () {
  window.location = '/import/' + encodeURIComponent($('#searchInput').val())
}
