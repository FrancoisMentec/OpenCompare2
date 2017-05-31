function search() {
  console.log('hello')
  window.location = '/search/' + encodeURI($('#searchInput').val())
}

$('#searchInput').keypress(function (event) {
    if (event.which === 13) {
        search()
    }
})

$('#searchButton').click(function () {
  search()
})
