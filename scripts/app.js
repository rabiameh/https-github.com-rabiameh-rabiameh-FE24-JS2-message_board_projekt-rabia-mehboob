import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFw3sG33l1tBpH6aGkzJswiXPBtbStNgU",
  authDomain: "message-board-d42f0.firebaseapp.com",
  projectId: "message-board-d42f0",
  storageBucket: "message-board-d42f0.appspot.com",
  messagingSenderId: "990408826134",
  appId: "1:990408826134:web:c1e81d782510d6cddb8437",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const authorInput = document.getElementById("author-input");
const messageContainer = document.getElementById("message-container");
const postStatus = document.getElementById("post-status");
const firebaseStatus = document.getElementById("firebase-status");

const userId = "user-" + Math.random().toString(36).substr(2, 9);
let typingTimeout;

function showTypingIndicator(userName) {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    const typingText = typingIndicator.querySelector(".typing-text");
    if (typingText) {
      typingText.textContent = `${userName} is typing...`;
    }
    typingIndicator.style.display = "flex";
  }
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.style.display = "none";
  }
}

async function updateTypingStatus(isTyping) {
  const typingRef = doc(db, "typing", userId);
  const userName = authorInput.value.trim() || "Anonymous";
  try {
    await setDoc(
      typingRef,
      {
        isTyping,
        userId,
        userName,
        lastTyped: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating typing status:", error);
  }
}

function handleTypingStart() {
  const userName = authorInput.value.trim() || "Anonymous";
  showTypingIndicator(userName);
  clearTimeout(typingTimeout);
  updateTypingStatus(true);

  typingTimeout = setTimeout(() => {
    handleTypingEnd();
  }, 2000);
}

function handleTypingEnd() {
  hideTypingIndicator();
  updateTypingStatus(false);
}
if (messageInput) {
  messageInput.addEventListener("input", handleTypingStart);
  messageInput.addEventListener("blur", handleTypingEnd);
}

const typingRef = collection(db, "typing");
onSnapshot(typingRef, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "modified") {
      const data = change.doc.data();
      if (data.isTyping && data.userId !== userId) {
        showTypingIndicator(data.userName);
        setTimeout(hideTypingIndicator, 2000);
      }
    }
  });
});

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const messageText = messageInput.value.trim();
  const author = authorInput.value.trim() || "Anonymous";

  if (!messageText) {
    postStatus.textContent = "Please enter a message";
    postStatus.style.color = "red";
    return;
  }

  try {
    postStatus.textContent = "Posting...";
    postStatus.style.color = "blue";
    handleTypingEnd();

    await addDoc(collection(db, "messages"), {
      text: messageText,
      author: author,
      timestamp: serverTimestamp(),
    });

    messageInput.value = "";
    postStatus.textContent = "Message posted!";
    postStatus.style.color = "green";
    setTimeout(() => (postStatus.textContent = ""), 2000);
  } catch (error) {
    postStatus.textContent = "Error posting message: " + error.message;
    postStatus.style.color = "red";
    console.error("Error:", error);
  }
});

const q = query(collection(db, "messages"), orderBy("timestamp"));
onSnapshot(
  q,
  (snapshot) => {
    updateConnectionStatus(true);
    messageContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const msg = doc.data();
      const time = msg.timestamp?.toDate() || new Date();
      const formattedTime = time.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
      });

      const messageEl = document.createElement("div");
      messageEl.className = "message";
      messageEl.innerHTML = `
        <div class="message-avatar">${msg.author.charAt(0).toUpperCase()}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${msg.author}</span>
            <span class="message-time">${formattedTime}</span>
          </div>
          <p class="message-text">${msg.text}</p>
        </div>
      `;
      messageContainer.appendChild(messageEl);
    });

    const messageCount = document.querySelector(".message-count");
    if (messageCount) {
      messageCount.textContent = `${snapshot.size} message${
        snapshot.size !== 1 ? "s" : ""
      }`;
    }
  },
  (error) => {
    updateConnectionStatus(false);
    console.error("Firestore error:", error);
  }
);

function updateConnectionStatus(connected) {
  if (connected) {
    firebaseStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
    firebaseStatus.style.color = "green";
  } else {
    firebaseStatus.innerHTML =
      '<i class="fas fa-exclamation-circle"></i> Disconnected';
    firebaseStatus.style.color = "red";
  }
}
