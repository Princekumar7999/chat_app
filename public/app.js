const firebaseConfig = {
    apiKey: "AIzaSyCou1rjja3xgDRTzZHEotqOgg2nD2ca0qc",
    authDomain: "chat-app-e3a0c.firebaseapp.com",
    databaseURL: "https://chat-app-e3a0c-default-rtdb.firebaseio.com",
    projectId: "chat-app-e3a0c",
    storageBucket: "chat-app-e3a0c.appspot.com",
    messagingSenderId: "1092680723271",
    appId: "1:1092680723271:web:bfbdce308ed4df0c3cba62",
    measurementId: "G-0GC95FDJ61"
  };
  
  firebase.initializeApp(firebaseConfig);
  console.log("firebase initialized");
  
  const db = firebase.database();
  console.log("Database reference created");
  const auth = firebase.auth();
  console.log("Auth reference created");
  
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  
  loginBtn.addEventListener('click', () => {
    console.log("Login button clicked");
    console.log("Email:", email.value);
    console.log("Password:", password.value); // Be cautious about logging passwords in a production environment
  
    auth.signInWithEmailAndPassword(email.value, password.value)
      .then((userCredential) => {
        console.log("Login successful", userCredential.user);
        showChatInterface();
      })
      .catch((error) => {
        console.error('Login error:', error.code, error.message);
        // Display error message to the user
        alert(`Login failed: ${error.message}`);
      });
  });
  
  // ... (rest of the code remains the same)

signupBtn.addEventListener('click', () => {
    console.log("Signup button clicked");
    console.log("Email:", email.value);
    console.log("Password:", password.value); // Be cautious about logging passwords in a production environment
  
    auth.createUserWithEmailAndPassword(email.value, password.value)
      .then((userCredential) => {
        console.log("Signup successful", userCredential.user);
        showChatInterface();
      })
      .catch((error) => {
        console.error('Signup error:', error.code, error.message);
        // Display error message to the user
        alert(`Signup failed: ${error.message}`);
      });
  });
  
  
  
  function showChatInterface() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';
    loadActiveUsers();
    listenForNewMessages(); // 
    // Don't load messages here, as no chat partner is selected yet
    listenForMessageStatusChanges();
  }
  
  auth.onAuthStateChanged((user) => {
    if (user) {
      showChatInterface();
    } else {
      document.getElementById('login-container').style.display = 'block';
      document.getElementById('chat-container').style.display = 'none';
    }
  });
  
  function loadActiveUsers() {
    const activeUsersRef = db.ref('active_users');
    const currentUser = auth.currentUser;
  
    activeUsersRef.on('value', (snapshot) => {
      const activeUsersContainer = document.getElementById('active-users');
      activeUsersContainer.innerHTML = '';
  
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const userData = childSnapshot.val();
  
        if (userData.isOnline && userId !== currentUser.uid) {
          const userElement = document.createElement('div');
          userElement.textContent = userData.email; // Display email instead of UID
          userElement.classList.add('user');
          userElement.addEventListener('click', () => startChat(userId, userData.email));
          activeUsersContainer.appendChild(userElement);
        }
      });
    });
  
    // Set user as active with email
    activeUsersRef.child(currentUser.uid).onDisconnect().remove();
    activeUsersRef.child(currentUser.uid).set({
      isOnline: true,
      email: currentUser.email
    });
  }

  
  
  let currentChatPartner = null;
let currentChatPartnerEmail = null;

function startChat(userId, userEmail) {
    currentChatPartner = userId;
    currentChatPartnerEmail = userEmail;
    document.getElementById('current-chat-partner').textContent = userEmail;
    document.getElementById('chat-messages').innerHTML = ''; // Clear existing messages
    localMessageIds.clear(); // Clear local message IDs
    loadMessages();
    listenForNewMessages();
    listenForMessageStatusChanges();
    console.log('Starting chat with:', userEmail);
  }
  
  
  function loadMessages() {
    const currentUser = auth.currentUser;
    const messagesRef = db.ref('messages');
  
    // Load last 50 messages (you can adjust this number)
    messagesRef.orderByChild('timestamp').limitToLast(50).once('value', (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        message.id = childSnapshot.key;
        if (
          (message.sender === currentUser.uid && message.recipient === currentChatPartner) ||
          (message.sender === currentChatPartner && message.recipient === currentUser.uid)
        ) {
          displayMessage(message);
        }
      });
      // Scroll to the bottom after loading past messages
      const messagesContainer = document.getElementById('chat-messages');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }
 
  function displayMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const currentUser = auth.currentUser;
    const isSender = message.sender === currentUser.uid;
  
    // Check if the message is already displayed
    if (document.querySelector(`[data-message-id="${message.id}"]`)) {
      return; // Skip if the message is already displayed
    }
  
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isSender ? 'sent' : 'received');
    messageElement.dataset.messageId = message.id;
  
    const senderElement = document.createElement('div');
    senderElement.classList.add('message-sender');
    senderElement.textContent = isSender ? 'You' : message.senderEmail;
    messageElement.appendChild(senderElement);
  
    const contentElement = document.createElement('span');
    contentElement.textContent = message.content;
    messageElement.appendChild(contentElement);
  
    if (isSender) {
      const statusElement = document.createElement('span');
      statusElement.classList.add('status');
      updateMessageStatus(message, statusElement);
      messageElement.appendChild(statusElement);
    } else {
      // Mark message as read immediately when displayed for the receiver
      markMessageAsRead(message.id);
    }
  
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }


  function updateMessageStatus(message, statusElement) {
    switch(message.status) {
      case 'read':
        statusElement.textContent = '✓✓';
        statusElement.style.color = 'blue';
        break;
      case 'delivered':
        statusElement.textContent = '✓✓';
        statusElement.style.color = 'gray';
        break;
      case 'sent':
      default:
        statusElement.textContent = '✓';
        statusElement.style.color = 'gray';
    }
  }
  
 

  let localMessageIds = new Set();

  function sendMessage() {
    const currentUser = auth.currentUser;
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
  
    if (content && currentChatPartner) {
      const messagesRef = db.ref('messages');
      const newMessageRef = messagesRef.push();
  
      const message = {
        sender: currentUser.uid,
        senderEmail: currentUser.email,
        recipient: currentChatPartner,
        recipientEmail: currentChatPartnerEmail,
        content: content,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'sent'  // Initial status
      };
  
      newMessageRef.set(message)
        .then(() => {
          messageInput.value = '';
          // Display the message immediately for the sender
          message.id = newMessageRef.key;
          localMessageIds.add(message.id);
          displayMessage(message);
        })
        .catch((error) => {
          console.error('Error sending message:', error);
          alert(`Error sending message: ${error.message}`);
        });
    } else if (!currentChatPartner) {
      alert('Please select a user to chat with first.');
    }
  }
  // ... (rest of the code remains the same)
  
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  function updateMessageDeliveryStatus(messageId) {
    const messageRef = db.ref(`messages/${messageId}`);
    messageRef.child('status').set('delivered');
  }
  
 
  function markMessageAsRead(messageId) {
    const messageRef = db.ref(`messages/${messageId}`);
    messageRef.transaction((currentData) => {
      if (currentData && currentData.status !== 'read') {
        currentData.status = 'read';
      }
      return currentData;
    });
  }
  
  function markAllMessagesAsRead() {
    const currentUser = auth.currentUser;
    db.ref('messages')
      .orderByChild('recipient')
      .equalTo(currentUser.uid)
      .once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (!message.read) {
            childSnapshot.ref.child('read').set(true);
          }
        });
      });
  }
  
 
  function listenForNewMessages() {
    const currentUser = auth.currentUser;
    const messagesRef = db.ref('messages');
  
    // Remove any existing listeners
    messagesRef.off('child_added');
  
    // Listen for all messages in real-time
    messagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
      const message = snapshot.val();
      message.id = snapshot.key;
      if (
        (message.sender === currentUser.uid && message.recipient === currentChatPartner) ||
        (message.sender === currentChatPartner && message.recipient === currentUser.uid)
      ) {
        // Only display the message if it's not already in the chat and not a local message
        if (!document.querySelector(`[data-message-id="${message.id}"]`) && !localMessageIds.has(message.id)) {
          displayMessage(message);
          if (message.sender === currentChatPartner) {
            markMessageAsRead(message.id);
          }
        }
      }
    });
  }

  function listenForMessageStatusChanges() {
    const currentUser = auth.currentUser;
    db.ref('messages')
      .orderByChild('sender')
      .equalTo(currentUser.uid)
      .on('child_changed', (snapshot) => {
        const message = snapshot.val();
        message.id = snapshot.key;
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        if (messageElement) {
          const statusElement = messageElement.querySelector('.status');
          if (statusElement) {
            updateMessageStatus(message, statusElement);
          }
        }
      });
  }