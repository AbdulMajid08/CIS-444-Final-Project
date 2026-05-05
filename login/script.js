import "../js/api.js";

function showSignup() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.add("hidden");
  document.getElementById("signupForm").classList.remove("hidden");
  clearErrors();
}

function showForgot() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.remove("hidden");
  const successMsg = document.getElementById("forgotSuccessMsg");
  successMsg.classList.add("hidden");
  successMsg.textContent = "";
  clearErrors();
}

function showLogin() {
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  clearErrors();
}

function clearErrors() {
  document.getElementById("errorMsg").textContent = "";
  document.getElementById("signupErrorMsg").textContent = "";
  document.getElementById("forgotErrorMsg").textContent = "";
}

async function LoginHandler() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  if (!email || !password) {
    errorMsg.textContent = "Please fill in both fields.";
    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.textContent = "Please enter a valid email address.";
    return;
  }

  errorMsg.textContent = "";
  try {
    const data = await api.login({ email: email, password: password });
    api.setSession(data.token, data.user);
    window.location.href = "../dashboard/index.html";
  } catch (err) {
    errorMsg.textContent = err.message || "Could not sign in.";
  }
}

async function ForgotPasswordHandler() {
  const email = document.getElementById("resetEmail").value.trim();
  const errorMsg = document.getElementById("forgotErrorMsg");
  const successMsg = document.getElementById("forgotSuccessMsg");
  successMsg.classList.add("hidden");
  successMsg.textContent = "";

  if (!email) {
    errorMsg.textContent = "Please enter your email address.";
    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.textContent = "Please enter a valid email address.";
    return;
  }

  errorMsg.textContent = "";
  try {
    await api.requestPasswordReset({ email });
    successMsg.textContent =
      "If an account exists for that email, you'll receive a link to reset your password shortly.";
    successMsg.classList.remove("hidden");
  } catch (err) {
    errorMsg.textContent = err.message || "Could not send reset email.";
  }
}

async function SignupHandler() {
  const name = document.getElementById("newName").value.trim();
  const email = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  const errorMsg = document.getElementById("signupErrorMsg");

  if (!name || !email || !password) {
    errorMsg.textContent = "Please fill in all fields.";
    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.textContent = "Please enter a valid email address.";
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters.";
    return;
  }

  errorMsg.textContent = "";
  try {
    const data = await api.register({
      name: name,
      email: email,
      password: password,
    });
    api.setSession(data.token, data.user);
    window.location.href = "../dashboard/index.html";
  } catch (err) {
    errorMsg.textContent = err.message || "Could not create account.";
  }
}

function isValidEmail(email) {
  return email.includes("@") && email.includes(".");
}

window.showSignup = showSignup;
window.showForgot = showForgot;
window.showLogin = showLogin;
window.LoginHandler = LoginHandler;
window.ForgotPasswordHandler = ForgotPasswordHandler;
window.SignupHandler = SignupHandler;

(function checkExistingSession() {
  api
    .waitForAuth()
    .then(function () {
      if (!api.getToken()) return;
      return api.me();
    })
    .then(function (data) {
      if (data) {
        window.location.replace("../dashboard/index.html");
      }
    })
    .catch(function () {
      api.clearSession();
    });
})();
