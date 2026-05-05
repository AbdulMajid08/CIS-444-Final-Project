import "../js/api.js";

let activeOobCode = null;

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

function showPanel(id) {
  ["loadingPanel", "invalidPanel", "resetForm", "successPanel"].forEach(function (panelId) {
    const el = document.getElementById(panelId);
    if (el) {
      el.classList.toggle("hidden", panelId !== id);
    }
  });
}

async function initResetPage() {
  const { mode, oobCode } = getResetLinkParams();

  if (mode !== "resetPassword" || !oobCode) {
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
    showPanel("invalidPanel");
    const msg = document.getElementById("invalidMsg");
    if (msg) {
      msg.textContent = e.message || "This link is invalid or has expired.";
    }
  }
}

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

  errorEl.textContent = "";
  try {
    await api.completePasswordReset({ oobCode: oobCode, newPassword: pass });
    showPanel("successPanel");
  } catch (err) {
    errorEl.textContent = err.message || "Could not update password.";
  }
}

window.SubmitPasswordResetHandler = SubmitPasswordResetHandler;

initResetPage();
