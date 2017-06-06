// Create signup popup
var signupForm = document.createElement('div')
var signupMail = new TextField('Mail')
signupMail.appendTo(signupForm)
var signupPseudo = new TextField('Pseudo')
signupPseudo.appendTo(signupForm)
var signupPassword = new TextField('Password', 'password')
signupPassword.appendTo(signupForm)
var signupPopup = new Popup('Sign up', signupForm, {
  'CANCEL': function () { signupPopup.hide() },
  'SIGN UP': function () { signup() }
})

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
var loginPopup = new Popup('Login', loginForm, {
  'CANCEL': function () { loginPopup.hide() },
  'LOGIN': function () { login() }
})

document.getElementById('loginButton').addEventListener('click', function () {
  loginPopup.show()
})
