import { app } from "./firebase-config.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// here we defind our firebase authentication and firestore db instance, this way we can use them in the API calls to insure user authentication and save entries
const auth = getAuth(app);
const db = getFirestore(app);

// this snapshot is a helper function that makes sure that the doc exists in the firestore db, this way we dont try and access data that doesnt exist
function snapshotExists(snap) {
  if (!snap) return false;
  if (typeof snap.exists === "function") {
    return snap.exists();
  }
  return !!snap.exists;
}

// this is so we wait for the authentication first before making any API calls, this way we avoid duplicate calls
let authReadyPromise = null;
function waitForAuth() {
  if (authReadyPromise) {
    return authReadyPromise;
  }
  authReadyPromise = new Promise(function (resolve) {
    const unsub = onAuthStateChanged(auth, function () {
      unsub();
      resolve();
    });
  });
  return authReadyPromise;
}

// we use this to store our users session data in the browser so that we can have access to that data throughout all pages
function syncUserFromAuth() {
  const u = auth.currentUser;
  if (!u) {
    sessionStorage.removeItem("user");
    return;
  }
  sessionStorage.setItem(
    "user",
    JSON.stringify({
      id: u.uid,
      email: u.email || "",
      name: u.displayName || "",
    })
  );
}

// if a user is signed in we return firebase as our token, this way we confirm that user is authenticated
// now we can use that token in the API calls
function getToken() {
  return auth.currentUser ? "firebase" : null;
}

// this is to load the user data from the storage for API calls
function getUser() {
  const raw = sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// user data is stored while loged in and cleared when logged out
function setSession(_token, user) {
  if (user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("user");
  }
}

// when user signs out we clear the all the session data that pertains to that user
function clearSession() {
  sessionStorage.removeItem("user");
  return signOut(auth);
}

// this is used to provide the user with feedback on errors they may get from firebase
function mapAuthError(err) {
  const code = err && err.code ? String(err.code) : "";
  if (code === "auth/email-already-in-use") {
    return "That email is already registered.";
  }
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters.";
  }
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Invalid email or password.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again later.";
  }
  if (
    code === "auth/invalid-action-code" ||
    code === "auth/expired-action-code" ||
    code === "auth/invalid-continue-uri"
  ) {
    return "This link is invalid or has expired. Request a new reset email.";
  }
  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters.";
  }
  return err.message || "Request failed.";
}

// this is used to build the reset password page 
function getPasswordResetContinueUrl() {
  if (typeof window === "undefined" || !window.location) {
    return undefined;
  }
  return `${window.location.origin}/login/reset.html`;
}

// this is used to make sure each user has access only to their personal entries
function journalEntriesRef(uid) {
  return collection(db, "users", uid, "journalEntries");
}

function entryDocRef(uid, entryId) {
  return doc(db, "users", uid, "journalEntries", String(entryId));
}

// this is used to make sure that our data that we recieve from firestore is in the needed format for the application
function docToEntry(id, data) {
  if (!data) return null;
  let createdAt = data.createdAt;
  if (createdAt && typeof createdAt.toDate === "function") {
    createdAt = createdAt.toDate().toISOString();
  } else if (createdAt && typeof createdAt === "object" && createdAt.seconds != null) {
    createdAt = new Date(createdAt.seconds * 1000).toISOString();
  } else {
    createdAt = createdAt || "";
  }
  return {
    id: id,
    date: data.date != null ? String(data.date) : "",
    title: data.title != null ? String(data.title) : "",
    mood: data.mood != null ? String(data.mood) : "",
    text: data.text != null ? String(data.text) : "",
    createdAt: createdAt,
  };
}

// this insures that the current users data is always availabe for that session for API calls
waitForAuth().then(syncUserFromAuth);
onAuthStateChanged(auth, syncUserFromAuth);

// this is the api call we use for access to the authentication and journal data
window.api = {
  waitForAuth: waitForAuth,

  getToken: getToken,
  getUser: getUser,
  setSession: setSession,
  clearSession: clearSession,

  // this is to handle the registartion of new users and then save their data to the session and firestore DB
  register: async function (body) {
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!name || !email || !password) {
      throw new Error("Please fill in all fields.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const user = { id: cred.user.uid, email: cred.user.email || email, name: name };
      setSession("firebase", user);
      return { token: "firebase", user: user };
    } catch (e) {
      const msg = mapAuthError(e);
      const err = new Error(msg);
      err.code = e.code;
      throw err;
    }
  },

  // if a user already exists we check their credentials and if authenticated we log them in and cahce their info for the session for future API calls
  login: async function (body) {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      throw new Error("Please fill in both fields.");
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const u = cred.user;
      const user = {
        id: u.uid,
        email: u.email || email,
        name: u.displayName || "",
      };
      setSession("firebase", user);
      return { token: "firebase", user: user };
    } catch (e) {
      const msg = mapAuthError(e);
      const err = new Error(msg);
      err.code = e.code;
      throw err;
    }
  },

  // if the user requests a password reset we send them an email that provides a link which allows them to reset password
  requestPasswordReset: async function (body) {
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      throw new Error("Please enter your email address.");
    }
    const actionCodeSettings = {
      url: getPasswordResetContinueUrl(),
      handleCodeInApp: false,
    };
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return { ok: true };
    } catch (e) {
      if (e && e.code === "auth/user-not-found") {
        return { ok: true };
      }
      const msg = mapAuthError(e);
      const err = new Error(msg);
      err.code = e.code;
      throw err;
    }
  },

  // this is used to make sure that the password reset link sent is valid and if it is we send it to the email the user provided
  validatePasswordResetCode: async function (oobCode) {
    const code = String(oobCode || "").trim();
    if (!code) {
      throw new Error("Invalid or missing reset link.");
    }
    try {
      const email = await firebaseVerifyPasswordResetCode(auth, code);
      return { email: email };
    } catch (e) {
      const msg = mapAuthError(e);
      const err = new Error(msg);
      err.code = e.code;
      throw err;
    }
  },

  // this is used to complete the password reset process, once changed the user can use new pass to login
  completePasswordReset: async function (body) {
    const oobCode = String(body.oobCode || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!oobCode) {
      throw new Error("Invalid or missing reset link.");
    }
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      return { ok: true };
    } catch (e) {
      const msg = mapAuthError(e);
      const err = new Error(msg);
      err.code = e.code;
      throw err;
    }
  },

  // this is to make sure that user is signed in before allowing access dashboard pages
  me: async function () {
    await waitForAuth();
    const u = auth.currentUser;
    if (!u) {
      const err = new Error("Not signed in.");
      err.status = 401;
      throw err;
    }
    const user = {
      id: u.uid,
      email: u.email || "",
      name: u.displayName || "",
    };
    setSession("firebase", user);
    return { user: user };
  },

  // this is to load the current signed in users personal entries, and we provide them in an order from newest to first
  listJournal: async function () {
    await waitForAuth();
    const u = auth.currentUser;
    if (!u) {
      const err = new Error("Not signed in.");
      err.status = 401;
      throw err;
    }
    const q = query(journalEntriesRef(u.uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const entries = [];
    snap.forEach(function (d) {
      entries.push(docToEntry(d.id, d.data()));
    });
    return { entries: entries };
  },

  // when a user is accessing an entry we have it read by its firestore doc ID to make sure that the user is accessing the correct entry
  getJournalEntry: async function (id) {
    await waitForAuth();
    const u = auth.currentUser;
    if (!u) {
      const err = new Error("Not signed in.");
      err.status = 401;
      throw err;
    }
    const snap = await getDoc(entryDocRef(u.uid, id));
    if (!snapshotExists(snap)) {
      const err = new Error("Entry not found.");
      err.status = 404;
      throw err;
    }
    return { entry: docToEntry(snap.id, snap.data()) };
  },

  // when a new entry is created we save it in firestore db as well under that users personal ID
  createJournalEntry: async function (body) {
    await waitForAuth();
    const u = auth.currentUser;
    if (!u) {
      const err = new Error("Not signed in.");
      err.status = 401;
      throw err;
    }
    const text = String(body.text || "").trim();
    if (!text) {
      throw new Error("Please write something before saving.");
    }
    const date = String(body.date || new Date().toLocaleDateString());
    const title = String(body.title || "Journal Entry");
    const mood = String(body.mood || "😐");
    const ref = await addDoc(journalEntriesRef(u.uid), {
      date: date,
      title: title,
      mood: mood,
      text: text,
      createdAt: serverTimestamp(),
    });
    return {
      entry: {
        id: ref.id,
        date: date,
        title: title,
        mood: mood,
        text: text,
      },
    };
  },

  // this is used so tht we can update the users entry if the users chooses to, but first we mae sure it exists
  updateJournalEntry: async function (id, body) {
    await waitForAuth();
    const u = auth.currentUser;
    if (!u) {
      const err = new Error("Not signed in.");
      err.status = 401;
      throw err;
    }
    const text = String(body.text || "").trim();
    if (!text) {
      throw new Error("Please write something before saving.");
    }
    const date = String(body.date || new Date().toLocaleDateString());
    let title = String(body.title || "").trim();
    if (!title) {
      title = "Journal Entry";
    }
    const ref = entryDocRef(u.uid, id);
    const existing = await getDoc(ref);
    if (!snapshotExists(existing)) {
      const err = new Error("Entry not found.");
      err.status = 404;
      throw err;
    }
    await updateDoc(ref, {
      text: text,
      date: date,
      title: title,
      mood: body.mood || "😐",
    });
    return { ok: true };
  },

  // if a user decides to delete an entry we allow them to do so after making sure it belongs to them
  deleteJournalEntry: async function (id) {
    await waitForAuth();
    const u = auth.currentUser;
    if (!u) {
      const err = new Error("Not signed in.");
      err.status = 401;
      throw err;
    }
    const ref = entryDocRef(u.uid, id);
    const existing = await getDoc(ref);
    if (!snapshotExists(existing)) {
      const err = new Error("Entry not found.");
      err.status = 404;
      throw err;
    }
    await deleteDoc(ref);
    return { ok: true };
  },
};
