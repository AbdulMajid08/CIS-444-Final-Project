import "../js/api.js";

function showSignup() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupForm").classList.remove("hidden");
  clearErrors();
}

function showLogin() {
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  clearErrors();
}

function clearErrors() {
  document.getElementById("errorMsg").textContent = "";
  document.getElementById("signupErrorMsg").textContent = "";
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
window.showLogin = showLogin;
window.LoginHandler = LoginHandler;
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
