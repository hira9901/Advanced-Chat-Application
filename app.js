// ==========================================
// FIREBASE CONFIGURATION (Unchanged Credentials)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC1WrqL39MRnm96-C50EAqOLttbwuvNlbs",
    authDomain: "database-c471c.firebaseapp.com",
    databaseURL: "https://database-c471c-default-rtdb.firebaseio.com",
    projectId: "database-c471c",
    storageBucket: "database-c471c.firebasestorage.app",
    messagingSenderId: "576994730556",
    appId: "1:576994730556:web:b50f3ee08cab96e5905939",
    measurementId: "G-YYNKPCQXMF"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// DOM References
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginTabBtn = document.getElementById('login-tab-btn');
const signupTabBtn = document.getElementById('signup-tab-btn');
const logoutBtn = document.getElementById('logout-btn');
const themeSelect = document.getElementById('theme-select');

const chatPlaceholder = document.getElementById('chat-placeholder');
const activeChatContainer = document.getElementById('active-chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const currentUsernameEl = document.getElementById('current-username');
const userAvatarEl = document.getElementById('user-avatar');
const activeChatTitle = document.getElementById('active-chat-title');
const activeAvatar = document.getElementById('active-avatar');
const activeChatStatus = document.getElementById('active-chat-status');
const activeStatusDot = document.getElementById('active-status-dot');

const directList = document.getElementById('direct-list');
const groupList = document.getElementById('group-list');

// Modals
const profileModal = document.getElementById('profile-modal');
const openProfileModal = document.getElementById('open-profile-modal');
const closeProfileModal = document.getElementById('close-profile-modal');
const saveProfileBtn = document.getElementById('save-profile-btn');
const profileNameInput = document.getElementById('profile-name-input');
const profileBioInput = document.getElementById('profile-bio-input');

const groupModal = document.getElementById('group-modal');
const openGroupModal = document.getElementById('open-group-modal');
const closeGroupModal = document.getElementById('close-group-modal');
const createGroupBtn = document.getElementById('create-group-btn');
const groupNameInput = document.getElementById('group-name-input');
const groupMembersList = document.getElementById('group-members-list');

const statusModal = document.getElementById('status-modal');
const openStatusBtn = document.getElementById('open-status-btn');
const closeStatusModal = document.getElementById('close-status-modal');
const uploadStatusBtn = document.getElementById('upload-status-btn');
const statusTextInput = document.getElementById('status-text-input');
const statusFileInput = document.getElementById('status-file-input');
const statusFeed = document.getElementById('status-feed');
const dropZone = document.getElementById('drop-zone');
const browseLink = document.getElementById('browse-link');
const filePreviewIndicator = document.getElementById('file-preview-indicator');

const storyPlayer = document.getElementById('story-player');
const closeStoryPlayer = document.getElementById('close-story-player');
const storyProgress = document.getElementById('story-progress');
const storyAvatar = document.getElementById('story-avatar');
const storyAuthorName = document.getElementById('story-author-name');
const storyTime = document.getElementById('story-time');
const storyContent = document.getElementById('story-content');

const mediaFileInput = document.getElementById('media-file-input');
const micBtn = document.getElementById('mic-btn');

let currentUser = null;
let activeChat = { id: null, type: null, name: null };
let currentMessageListener = null;
let presenceListener = null;
let mediaRecorder = null;
let audioChunks = [];
let droppedFile = null;

// ==========================================
// 1. AUTH & PRESENCE SYSTEM
// ==========================================
loginTabBtn.addEventListener('click', () => {
    loginTabBtn.classList.add('active');
    signupTabBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupTabBtn.addEventListener('click', () => {
    signupTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

document.querySelectorAll('.chat-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chat-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.chat-list').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
    });
});

themeSelect.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('chat_theme', selectedTheme);
});
const savedTheme = localStorage.getItem('chat_theme') || 'purple';
document.documentElement.setAttribute('data-theme', savedTheme);
themeSelect.value = savedTheme;

function addEmoji(emoji) {
    messageInput.value += emoji;
    messageInput.focus();
}
window.addEmoji = addEmoji;

function setupPresence(uid) {
    const userStatusRef = db.ref(`status/${uid}`);
    db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === false) return;
        userStatusRef.onDisconnect().set({ state: 'offline' })
            .then(() => userStatusRef.set({ state: 'online' }));
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        authScreen.classList.remove('active');
        chatScreen.classList.add('active');

        const displayName = user.displayName || user.email.split('@')[0];
        currentUsernameEl.textContent = displayName;
        userAvatarEl.textContent = displayName.charAt(0).toUpperCase();

        // Ensure user node is registered in the public database list upon login/signup
        db.ref(`users/${user.uid}`).set({
            uid: user.uid,
            name: displayName,
            email: user.email,
            bio: "Available"
        });

        setupPresence(user.uid);
        loadSidebarData();
    } else {
        if (currentUser) db.ref(`status/${currentUser.uid}`).set({ state: 'offline' });
        currentUser = null;
        chatScreen.classList.remove('active');
        authScreen.classList.add('active');
    }
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    auth.createUserWithEmailAndPassword(
        document.getElementById('signup-email').value,
        document.getElementById('signup-password').value
    )
    .then((cred) => cred.user.updateProfile({ displayName: name }))
    .catch(err => alert(err.message));
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(
        document.getElementById('login-email').value,
        document.getElementById('login-password').value
    ).catch(err => alert(err.message));
});

logoutBtn.addEventListener('click', () => auth.signOut());

// ==========================================
// 2. SIDEBAR (AUTO-POPULATING CONTACTS & GROUPS)
// ==========================================
function loadSidebarData() {
    // Automatically load all accounts registered in the database for direct chats & group selection
    db.ref('users').on('value', (snapshot) => {
        directList.innerHTML = '';
        groupMembersList.innerHTML = '';
        const users = snapshot.val();
        if (!users) return;

        Object.keys(users).forEach(uid => {
            if (uid === currentUser.uid) return;
            const uData = users[uid];

            // Append to Direct Contacts List
            const item = document.createElement('div');
            item.classList.add('chat-list-item');
            item.innerHTML = `
                <div class="avatar-wrapper" id="avatar-wrap-${uid}">
                    <div class="avatar">${uData.name.charAt(0).toUpperCase()}</div>
                </div>
                <div class="item-info">
                    <h4>${escapeHtml(uData.name)}</h4>
                    <p>${escapeHtml(uData.bio || 'Available')}</p>
                </div>
            `;
            item.addEventListener('click', () => selectChat(uid, 'direct', uData.name));
            directList.appendChild(item);

            // Append to Group Member Selection Checkboxes
            const checkboxDiv = document.createElement('div');
            checkboxDiv.style.cssText = "display:flex; gap:8px; padding:6px 0; font-size:13px; color:var(--text-color); align-items:center;";
            checkboxDiv.innerHTML = `<input type="checkbox" value="${uid}" style="width:16px; height:16px; cursor:pointer;"> <span>${escapeHtml(uData.name)}</span>`;
            groupMembersList.appendChild(checkboxDiv);

            checkUserStatusRing(uid);
        });
    });

    // Load Groups
    db.ref('groups').on('value', (snapshot) => {
        groupList.innerHTML = '';
        const groups = snapshot.val();
        if (!groups) return;

        Object.keys(groups).forEach(gid => {
            const gData = groups[gid];
            if (gData.members && gData.members[currentUser.uid]) {
                const item = document.createElement('div');
                item.classList.add('chat-list-item');
                item.innerHTML = `
                    <div class="avatar" style="background:var(--primary-hover);"><i class="fa-solid fa-users"></i></div>
                    <div class="item-info">
                        <h4>${escapeHtml(gData.name)}</h4>
                        <p>Group Conversation</p>
                    </div>
                `;
                item.addEventListener('click', () => selectChat(gid, 'group', gData.name));
                groupList.appendChild(item);
            }
        });
    });
}

function selectChat(id, type, name) {
    activeChat = { id, type, name };
    chatPlaceholder.classList.add('hidden');
    activeChatContainer.classList.remove('hidden');
    activeChatTitle.textContent = name;
    activeAvatar.textContent = name.charAt(0).toUpperCase();

    if (currentMessageListener) db.ref(currentMessageListener).off();
    if (presenceListener) presenceListener.off();

    messagesContainer.innerHTML = '';

    if (type === 'direct') {
        presenceListener = db.ref(`status/${id}`);
        presenceListener.on('value', (snap) => {
            const val = snap.val();
            if (val && val.state === 'online') {
                activeChatStatus.textContent = 'Online';
                activeStatusDot.className = 'status-dot online';
            } else {
                activeChatStatus.textContent = 'Offline';
                activeStatusDot.className = 'status-dot';
            }
        });

        const chatPath = getDirectChatRoomId(currentUser.uid, id);
        currentMessageListener = chatPath;

        db.ref(chatPath).on('child_added', (snapshot) => {
            const msg = snapshot.val();
            const msgId = snapshot.key;
            displayMessage(msgId, msg);

            if (msg.uid !== currentUser.uid && !msg.seen) {
                db.ref(`${chatPath}/${msgId}`).update({ seen: true });
            }
        });

        db.ref(chatPath).on('child_changed', (snapshot) => {
            updateMessageInDOM(snapshot.key, snapshot.val());
        });
        db.ref(chatPath).on('child_removed', (snapshot) => {
            const el = document.getElementById(`msg-${snapshot.key}`);
            if (el) el.remove();
        });

    } else {
        activeChatStatus.textContent = 'Group';
        activeStatusDot.className = 'status-dot';
        const groupPath = `group_messages/${id}`;
        currentMessageListener = groupPath;

        db.ref(groupPath).on('child_added', (snapshot) => {
            displayMessage(snapshot.key, snapshot.val());
        });
        db.ref(groupPath).on('child_changed', (snapshot) => {
            updateMessageInDOM(snapshot.key, snapshot.val());
        });
        db.ref(groupPath).on('child_removed', (snapshot) => {
            const el = document.getElementById(`msg-${snapshot.key}`);
            if (el) el.remove();
        });
    }
}

function getDirectChatRoomId(uid1, uid2) {
    return uid1 < uid2 ? `chats/${uid1}_${uid2}` : `chats/${uid2}_${uid1}`;
}

// ==========================================
// 3. MESSAGING, REACTIONS & DELETE FEATURES
// ==========================================
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !activeChat.id) return;
    sendMessage({ text, type: 'text' });
    messageInput.value = '';
});

mediaFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat.id) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        sendMessage({ mediaUrl: evt.target.result, type: file.type.startsWith('video') ? 'video' : 'image' });
    };
    reader.readAsDataURL(file);
});

function sendMessage(payload) {
    const messageData = {
        uid: currentUser.uid,
        sender: currentUser.displayName || currentUser.email.split('@')[0],
        type: payload.type,
        text: payload.text || '',
        mediaUrl: payload.mediaUrl || '',
        timestamp: Date.now(),
        seen: false,
        reactions: {}
    };

    const chatPath = activeChat.type === 'direct' 
        ? getDirectChatRoomId(currentUser.uid, activeChat.id) 
        : `group_messages/${activeChat.id}`;

    db.ref(chatPath).push(messageData);
}

function displayMessage(msgId, msg) {
    if (document.getElementById(`msg-${msgId}`)) return;
    const messageDiv = document.createElement('div');
    const isSent = msg.uid === currentUser.uid;
    messageDiv.id = `msg-${msgId}`;
    messageDiv.classList.add('message', isSent ? 'sent' : 'received');
    messageDiv.innerHTML = renderMessageHTML(msgId, msg, isSent);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateMessageInDOM(msgId, msg) {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
        el.innerHTML = renderMessageHTML(msgId, msg, msg.uid === currentUser.uid);
    }
}

function renderMessageHTML(msgId, msg, isSent) {
    let contentHtml = '';
    if (msg.type === 'text') contentHtml = `<div class="msg-text">${escapeHtml(msg.text)}</div>`;
    else if (msg.type === 'image') contentHtml = `<img src="${msg.mediaUrl}">`;
    else if (msg.type === 'video') contentHtml = `<video src="${msg.mediaUrl}" controls></video>`;
    else if (msg.type === 'audio') contentHtml = `<audio src="${msg.mediaUrl}" controls></audio>`;

    let reactionsHtml = '';
    if (msg.reactions) {
        const uniqueEmojis = Object.values(msg.reactions);
        if (uniqueEmojis.length > 0) {
            reactionsHtml = `<div class="msg-reactions">${uniqueEmojis.join(' ')}</div>`;
        }
    }

    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const seenTickHtml = isSent && activeChat.type === 'direct' 
        ? `<span class="seen-tick ${msg.seen ? 'read' : ''}">${msg.seen ? '✓✓' : '✓'}</span>` 
        : '';

    const deleteBtn = isSent 
        ? `<i class="fa-solid fa-trash delete-msg-btn" onclick="deleteMessage('${msgId}')" title="Delete"></i>` 
        : '';

    return `
        <div class="reaction-bar">
            <span onclick="reactToMessage('${msgId}', '❤️')">❤️</span>
            <span onclick="reactToMessage('${msgId}', '😂')">😂</span>
            <span onclick="reactToMessage('${msgId}', '👍')">👍</span>
            <span onclick="reactToMessage('${msgId}', '🔥')">🔥</span>
        </div>
        ${!isSent && activeChat.type === 'group' ? `<div class="sender-name">${escapeHtml(msg.sender)}</div>` : ''}
        ${contentHtml}
        ${reactionsHtml}
        <div class="msg-meta">
            <span class="msg-time">${timeStr}</span>
            ${seenTickHtml}
            ${deleteBtn}
        </div>
    `;
}

window.reactToMessage = function(msgId, emoji) {
    const chatPath = activeChat.type === 'direct' 
        ? getDirectChatRoomId(currentUser.uid, activeChat.id) 
        : `group_messages/${activeChat.id}`;
    db.ref(`${chatPath}/${msgId}/reactions/${currentUser.uid}`).set(emoji);
};

window.deleteMessage = function(msgId) {
    if (!confirm("Delete this message for everyone?")) return;
    const chatPath = activeChat.type === 'direct' 
        ? getDirectChatRoomId(currentUser.uid, activeChat.id) 
        : `group_messages/${activeChat.id}`;
    db.ref(`${chatPath}/${msgId}`).remove();
};

// Voice Note Recording
micBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const reader = new FileReader();
                reader.onload = evt => sendMessage({ mediaUrl: evt.target.result, type: 'audio' });
                reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/webm' }));
            };
            mediaRecorder.start();
            micBtn.style.color = '#ef4444';
        } catch (err) { alert("Microphone access blocked."); }
    } else {
        mediaRecorder.stop();
        micBtn.style.color = '';
    }
});

// ==========================================
// 4. STATUS & DRAG-AND-DROP UPLOADS
// ==========================================
openStatusBtn.addEventListener('click', () => {
    loadStatuses();
    statusModal.classList.remove('hidden');
});
closeStatusModal.addEventListener('click', () => statusModal.classList.add('hidden'));

browseLink.addEventListener('click', () => statusFileInput.click());

statusFileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        droppedFile = e.target.files[0];
        filePreviewIndicator.textContent = `Attached: ${droppedFile.name}`;
    }
});

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        droppedFile = files[0];
        filePreviewIndicator.textContent = `Attached: ${droppedFile.name}`;
    }
});

uploadStatusBtn.addEventListener('click', () => {
    const text = statusTextInput.value.trim();

    if (droppedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            saveStatusToDB(text, e.target.result, droppedFile.type.startsWith('video') ? 'video' : 'image');
        };
        reader.readAsDataURL(droppedFile);
    } else if (text) {
        saveStatusToDB(text, '', 'text');
    } else {
        alert("Please enter text or attach an image/video file.");
    }
});

function saveStatusToDB(text, mediaUrl, type) {
    db.ref('statuses').push({
        uid: currentUser.uid,
        name: currentUser.displayName || 'User',
        text: text,
        mediaUrl: mediaUrl,
        type: type,
        timestamp: Date.now()
    }).then(() => {
        statusTextInput.value = '';
        statusFileInput.value = '';
        droppedFile = null;
        filePreviewIndicator.textContent = '';
        loadStatuses();
    });
}

function loadStatuses() {
    db.ref('statuses').on('value', (snapshot) => {
        statusFeed.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;

        const now = Date.now();
        Object.keys(data).forEach(id => {
            const item = data[id];
            if (now - item.timestamp > 86400000) return;

            const div = document.createElement('div');
            div.classList.add('status-feed-item');
            div.innerHTML = `
                <div class="avatar">${item.name.charAt(0).toUpperCase()}</div>
                <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span style="display:block; font-size:11px; color:var(--text-light);">${new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
            `;
            div.addEventListener('click', () => playStory(item));
            statusFeed.appendChild(div);
        });
    });
}

function checkUserStatusRing(uid) {
    db.ref('statuses').orderByChild('uid').equalTo(uid).once('value', (snap) => {
        if (snap.exists()) {
            const wrap = document.getElementById(`avatar-wrap-${uid}`);
            if (wrap) wrap.classList.add('has-status');
        }
    });
}

function playStory(status) {
    statusModal.classList.add('hidden');
    storyPlayer.classList.remove('hidden');
    storyAvatar.textContent = status.name.charAt(0).toUpperCase();
    storyAuthorName.textContent = status.name;
    storyTime.textContent = new Date(status.timestamp).toLocaleTimeString();

    if (status.type === 'text') {
        storyContent.innerHTML = `<p>${escapeHtml(status.text)}</p>`;
    } else if (status.type === 'image') {
        storyContent.innerHTML = `<img src="${status.mediaUrl}">`;
    } else if (status.type === 'video') {
        storyContent.innerHTML = `<video src="${status.mediaUrl}" autoplay></video>`;
    }

    storyProgress.style.width = '0%';
    setTimeout(() => storyProgress.style.width = '100%', 50);

    const timer = setTimeout(() => {
        storyPlayer.classList.add('hidden');
    }, 5000);

    closeStoryPlayer.onclick = () => {
        clearTimeout(timer);
        storyPlayer.classList.add('hidden');
    };
}

// Profile & Group Modals
openProfileModal.addEventListener('click', () => {
    profileNameInput.value = currentUser.displayName || '';
    db.ref(`users/${currentUser.uid}`).once('value', snap => {
        if (snap.val() && snap.val().bio) profileBioInput.value = snap.val().bio;
    });
    profileModal.classList.remove('hidden');
});
closeProfileModal.addEventListener('click', () => profileModal.classList.add('hidden'));

saveProfileBtn.addEventListener('click', () => {
    const name = profileNameInput.value.trim();
    const bio = profileBioInput.value.trim();
    if (!name) return;

    currentUser.updateProfile({ displayName: name }).then(() => {
        db.ref(`users/${currentUser.uid}`).update({ name, bio });
        currentUsernameEl.textContent = name;
        userAvatarEl.textContent = name.charAt(0).toUpperCase();
        profileModal.classList.add('hidden');
    });
});

openGroupModal.addEventListener('click', () => groupModal.classList.remove('hidden'));
closeGroupModal.addEventListener('click', () => groupModal.classList.add('hidden'));

createGroupBtn.addEventListener('click', () => {
    const name = groupNameInput.value.trim();
    if (!name) return;

    const members = { [currentUser.uid]: true };
    groupMembersList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        members[cb.value] = true;
    });

    db.ref('groups').push({ name, admin: currentUser.uid, members }).then(() => {
        groupNameInput.value = '';
        groupModal.classList.add('hidden');
    });
});

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
