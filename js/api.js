import { app } from "./firebase-config.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
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

const auth = getAuth(app);
const db = getFirestore(app);

function snapshotExists(snap) {
  if (!snap) return false;
  if (typeof snap.exists === "function") {
    return snap.exists();
  }
  return !!snap.exists;
}

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

function getToken() {
  return auth.currentUser ? "firebase" : null;
}

function getUser() {
  const raw = sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(_token, user) {
  if (user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("user");
  }
}

function clearSession() {
  sessionStorage.removeItem("user");
  return signOut(auth);
}

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
  return err.message || "Request failed.";
}

function journalEntriesRef(uid) {
  return collection(db, "users", uid, "journalEntries");
}

function entryDocRef(uid, entryId) {
  return doc(db, "users", uid, "journalEntries", String(entryId));
}

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

waitForAuth().then(syncUserFromAuth);
onAuthStateChanged(auth, syncUserFromAuth);

window.api = {
  waitForAuth: waitForAuth,

  getToken: getToken,
  getUser: getUser,
  setSession: setSession,
  clearSession: clearSession,

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
    });
    return { ok: true };
  },

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
