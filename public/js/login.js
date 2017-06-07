var user = null

function connect () {
  var r = new XMLHttpRequest()
  r.open('GET', '/user', true)
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) return
    var res = JSON.parse(r.responseText)
    if (res.user) {
      user = res.user
      document.getElementById('userPseudo').innerHTML = user.pseudo
    } else {
      console.log('not connected')
    }
  }
  r.send()
}

// Create login popup
var loginForm = document.createElement('div')
var signupButton = document.createElement('a')
signupButton.innerHTML = 'Or create an account'
signupButton.addEventListener('click', function () {
  loginPopup.hide()
  signupPopup.show()
})
loginForm.appendChild(signupButton)
var loginMail = new TextField('Mail')
loginMail.appendTo(loginForm)
var loginPassword = new TextField('Password', 'password')
loginPassword.appendTo(loginForm)
var loginSuccess = document.createElement('div')
loginSuccess.className = 'textSuccess'
loginForm.appendChild(loginSuccess)
var loginError = document.createElement('div')
loginError.className = 'textError'
loginForm.appendChild(loginError)
var loginPopup = new Popup('Login', loginForm, {
  'CANCEL': function () { loginPopup.hide() },
  'LOGIN': function () {
    var r = new XMLHttpRequest()
    r.open('POST', '/login', true)
    r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return
      var res = JSON.parse(r.responseText)
      if (res.error) {
        loginError.innerHTML = res.error
      } else {
        connect()
        loginPopup.hide()
      }
    }
    r.send('mail=' + encodeURIComponent(loginMail.value) +
      '&password=' + encodeURIComponent(loginPassword.value))
  }
})

// Create signup popup
var signupForm = document.createElement('div')
var loginButton = document.createElement('a')
loginButton.innerHTML = 'Or login into an existing account'
loginButton.addEventListener('click', function () {
  signupPopup.hide()
  loginPopup.show()
})
signupForm.appendChild(loginButton)
var signupMail = new TextField('Mail')
signupMail.appendTo(signupForm)
var signupPseudo = new TextField('Pseudo')
signupPseudo.appendTo(signupForm)
var signupPassword = new TextField('Password', 'password')
signupPassword.appendTo(signupForm)
var signupError = document.createElement('div')
signupError.className = 'textError'
signupForm.appendChild(signupError)
var signupPopup = new Popup('Sign up', signupForm, {
  'CANCEL': function () { signupPopup.hide() },
  'SIGN UP': function () {
    var r = new XMLHttpRequest()
    r.open('POST', '/signup', true)
    r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return
      var res = JSON.parse(r.responseText)
      if (res.error) {
        signupError.innerHTML = res.error
      } else {
        loginSuccess.innerHTML = 'Your account got created, you can now login into it.'
        signupPopup.hide()
        loginPopup.show()
      }
    }
    r.send('mail=' + encodeURIComponent(signupMail.value) +
      '&pseudo=' + encodeURIComponent(signupPseudo.value) +
      '&password=' + encodeURIComponent(signupPassword.value))
  }
})

document.getElementById('loginButton').addEventListener('click', function () {
  loginPopup.show()
})

connect()
