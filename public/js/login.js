var user = null

var userPseudo = document.getElementById('userPseudo')
var loginButton = document.getElementById('loginButton')
loginButton.addEventListener('click', function () {
  loginPopup.show()
})
var logoutButton = document.getElementById('logoutButton')
logoutButton.addEventListener('click', function () {
  logout()
})

function login () {
  var r = new XMLHttpRequest()
  r.open('POST', '/login', true)
  r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) return
    var res = JSON.parse(r.responseText)
    if (res.error) {
      loginError.innerHTML = res.error
    } else {
      getUser()
      loginPopup.hide()
    }
  }
  r.send('mail=' + encodeURIComponent(loginMail.value) +
    '&password=' + encodeURIComponent(loginPassword.value))
}

function getUser () {
  var r = new XMLHttpRequest()
  r.open('GET', '/user', true)
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) return
    var res = JSON.parse(r.responseText)
    if (res.user) {
      user = res.user
      userPseudo.innerHTML = user.pseudo
      loginButton.style.display = 'none'
      logoutButton.style.display = 'inline-block'
    } else {
      userPseudo.innerHTML = ''
      loginButton.style.display = 'inline-block'
      logoutButton.style.display = 'none'
    }
  }
  r.send()
}

function logout () {
  var r = new XMLHttpRequest()
  r.open('GET', '/logout', true)
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) return
    userPseudo.innerHTML = ''
    loginButton.style.display = 'inline-block'
    logoutButton.style.display = 'none'
  }
  r.send()
}

// Create login popup
var loginForm = document.createElement('div')
var signupLink = document.createElement('a')
signupLink.innerHTML = 'Or create an account'
signupLink.addEventListener('click', function () {
  loginPopup.hide()
  signupPopup.show()
})
loginForm.appendChild(signupLink)
var loginMail = new TextField('Mail')
loginMail.appendTo(loginForm)
var loginPassword = new TextField('Password', 'password')
loginPassword.addEventListener('keyup', function (e) {
  if (e.keyCode == 13) {
    login()
  }
})
loginPassword.appendTo(loginForm)
var loginSuccess = document.createElement('div')
loginSuccess.className = 'textSuccess'
loginForm.appendChild(loginSuccess)
var loginError = document.createElement('div')
loginError.className = 'textError'
loginForm.appendChild(loginError)
var loginPopup = new Popup('Login', loginForm, {
  'CANCEL': function () { loginPopup.hide() },
  'LOGIN': function () { login() }
})

// Create signup popup
var signupForm = document.createElement('div')
var loginLink = document.createElement('a')
loginLink.innerHTML = 'Or login into an existing account'
loginLink.addEventListener('click', function () {
  signupPopup.hide()
  loginPopup.show()
})
signupForm.appendChild(loginLink)
var signupMail = new TextField('Mail', 'mail',  function (tf) {
  if (!isMail(tf.value)) return 'Error: This is not a valid mail adress'
  return null
})
signupMail.appendTo(signupForm)
var signupPseudo = new TextField('Pseudo', 'text', function (tf) {
  if (tf.value.length < 3) return ('Error: The minimal pseudo length is 3')
  if (tf.value.length > 20) return ('Error: The maximal pseudo length is 20')
  return null
})
signupPseudo.appendTo(signupForm)
var signupPassword = new TextField('Password', 'password', function (tf) {
  if (tf.value.length < 5) return ('Error: The minimal password length is 5')
  return null
})
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

getUser()
