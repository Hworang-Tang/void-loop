// Firebase config (from your prompt)
const firebaseConfig = {
  apiKey: "AIzaSyCs5F6ZBljD0TBgVAFLilzl8R8LWHw0wDk",
  authDomain: "essan-jss.firebaseapp.com",
  projectId: "essan-jss",
  storageBucket: "essan-jss.appspot.com",
  messagingSenderId: "552344380990",
  appId: "1:552344380990:web:eb13d817ac2054dc76936f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;

// Auth UI
const authPanel = document.getElementById('authPanel');
const userPanel = document.getElementById('userPanel');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authPic = document.getElementById('authPic');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const authError = document.getElementById('authError');
const userPic = document.getElementById('userPic');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');

function showUserPanel(user, profile) {
  userPanel.style.display = '';
  userPic.src = profile.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName||"User");
  userName.textContent = profile.displayName;
  userEmail.textContent = profile.email;
  document.getElementById('startBtn').disabled = false;
}
function hideUserPanel() {
  userPanel.style.display = 'none';
  document.getElementById('startBtn').disabled = true;
}
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    authPanel.style.display = "none";
    // Load or create user profile in Firestore
    let doc = await db.collection("users").doc(user.uid).get();
    if (!doc.exists) {
      await db.collection("users").doc(user.uid).set({
        displayName: user.displayName || authName.value,
        email: user.email,
        photoURL: user.photoURL || '',
        upgrades: 0,
        coins: 0,
        weaponLevel: 1,
        hearts: 3,
        best: 0
      });
      doc = await db.collection("users").doc(user.uid).get();
    }
    let data = doc.data();
    showUserPanel(user, data);
    // Optionally: load user stats into localStorage/game.js
    localStorage.voidloopSave = JSON.stringify({
      best: data.best || 0,
      coins: data.coins || 0,
      weapon: data.weaponLevel || 1,
      health: data.hearts || 3
    });
  } else {
    currentUser = null;
    authPanel.style.display = "";
    hideUserPanel();
  }
});
signUpBtn.onclick = async () => {
  authError.textContent = "";
  if (!authName.value || !authEmail.value || !authPassword.value) {
    authError.textContent = "Please fill all fields.";
    return;
  }
  try {
    const userCred = await auth.createUserWithEmailAndPassword(authEmail.value, authPassword.value);
    let user = userCred.user;
    await user.updateProfile({
      displayName: authName.value
    });
    let photoURL = '';
    if (authPic.files[0]) {
      const snap = await storage.ref('profiles/'+user.uid).put(authPic.files[0]);
      photoURL = await snap.ref.getDownloadURL();
      await user.updateProfile({photoURL});
    }
    await db.collection("users").doc(user.uid).set({
      displayName: authName.value,
      email: user.email,
      photoURL,
      upgrades: 0,
      coins: 0,
      weaponLevel: 1,
      hearts: 3,
      best: 0
    });
  } catch (e) {
    authError.textContent = e.message;
  }
};
signInBtn.onclick = async () => {
  authError.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(authEmail.value, authPassword.value);
  } catch (e) {
    authError.textContent = e.message;
  }
};
signOutBtn.onclick = async () => {
  await auth.signOut();
};