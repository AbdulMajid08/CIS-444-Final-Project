

function showSignup() {
  document.getElementById('loginForm').classList.add('hidden');

  document.getElementById('signupForm').classList.remove('hidden');
  clearErrors();
}

function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');

  
  document.getElementById('loginForm').classList.remove('hidden');

  clearErrors();
}

function clearErrors() {
  document.getElementById('errorMsg').textContent = '';
  document.getElementById('signupErrorMsg').textContent = '';
}


// this function is responsible for handling the signup process

function LoginHandler() {
  const email = document.getElementById('email').value.trim();


  const password= document.getElementById('password').value.trim();

  const errorMsg= document.getElementById('errorMsg');


  //  validation

  if (!email || !password) {
    errorMsg.textContent= 'Please fill in both fields.';

    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.textContent = 'Please enter a valid email address.';
    return;
  }

  // right now all this does is log it into the function and when an account is made it redirectts to dashbord page assuming its made
  // what needs to be done is to replace this with the PHP backend call
  console.log('Logging in with:', email);
  localStorage.setItem('currentUser', email);
  window.location.href = '../dashboard/index.html';
}


// this function is responsible for handling the signup process

function SignupHandler() {
  const name= document.getElementById('newName').value.trim();

  const email = document.getElementById('newEmail').value.trim();

  const password= document.getElementById('newPassword').value.trim();


  const errorMsg = document.getElementById('signupErrorMsg');


  // Basic validation
  if (!name || !email || !password) {
        errorMsg.textContent = 'Please fill in all fields.';

    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.textContent= 'Please enter a valid email address.';

     return;
  }

  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters.';
    return;
  }

  // right now all this does is log it into the function and when an account is made it redirectts to dashbord page assuming its made
  // what needs to be done is to replace this with the PHP backend call 
 
   console.log('Signing up:', name, email);
    localStorage.setItem('currentUser', email);
    window.location.href = '../dashboard/index.html';
}


// helper function to see if email format is good

function isValidEmail(email) {
  return email.includes('@') && email.includes('.');
}
