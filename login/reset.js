import "../js/api.js";

// used to store the active password reset code after validated
let activeOobCode = null;

// parses the reset link sent to the user and gets the needed parameters to validate the link and then the password reset process can be done
function getResetLinkParams() {
  const fromSearch = new URLSearchParams(window.location.search);
  let mode = fromSearch.get("mode");
  let oobCode = fromSearch.get("oobCode");
  if (!oobCode && window.location.hash && window.location.hash.length > 1) {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    mode = mode || h.get("mode");
    oobCode = h.get("oobCode");
  }
  return { mode: mode, oobCode: oobCode };
}

// used in order to show the correct message to the user based on the stage of their reset process
// if link is valid we show form if not we show invalid message
function showPanel(id) {
  ["loadingPanel", "invalidPanel", "resetForm", "successPanel"].forEach(function (panelId) {
    const el = document.getElementById(panelId);
    if (el) {
      el.classList.toggle("hidden", panelId !== id);
    }
  });
}

// this is the mai function used when our page loads, we use it to validate our reset link and show correct form
async function initResetPage() {
  const { mode, oobCode } = getResetLinkParams();

  if (mode !== "resetPassword" || !oobCode) {
    // Link is not a valid password reset link.
    showPanel("invalidPanel");
    const msg = document.getElementById("invalidMsg");
    if (msg) {
      msg.textContent =
        "This reset link is missing information or is not a password reset link. Open the link from your email, or request a new reset from sign in.";
    }
    return;
  }

  try {
    const result = await api.validatePasswordResetCode(oobCode);
    const hint = document.getElementById("resetEmailHint");
    if (hint && result && result.email) {
      hint.textContent = "Account: " + result.email;
    }
    activeOobCode = oobCode;
    showPanel("resetForm");
  } catch (e) {
    // If validation fails, show the invalid link message.
    showPanel("invalidPanel");
    const msg = document.getElementById("invalidMsg");
    if (msg) {
      msg.textContent = e.message || "This link is invalid or has expired.";
    }
  }
}

// used to handle the reset form submission, validates it, and then the password is reset
async function SubmitPasswordResetHandler() {
  const oobCode = activeOobCode;
  const pass = document.getElementById("newPasswordReset").value;
  const confirm = document.getElementById("confirmPasswordReset").value;
  const errorEl = document.getElementById("resetErrorMsg");

  if (!oobCode) {
    errorEl.textContent = "Reset session expired. Open the link from your email again.";
    return;
  }

  if (!pass || pass.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (pass !== confirm) {
    errorEl.textContent = "Passwords do not match.";
    return;
  }

  // cleares and old error messages, then we attepmt to reset again
  errorEl.textContent = "";
  try {
    await api.completePasswordReset({ oobCode: oobCode, newPassword: pass });
    showPanel("successPanel");
  } catch (err) {
    errorEl.textContent = err.message || "Could not update password.";
  }
}

// this is used to make sure that the form is calling the submit handler when the user clicks the button
window.SubmitPasswordResetHandler = SubmitPasswordResetHandler;

// starts the page initilization as soon as page is loaded
initResetPage();
