// Conectar con el servidor
const socket = io();

// Obtener el nombre del usuario guardado en login
const myUsername = localStorage.getItem('username');

// Si no hay usuario, regresar al login
if (!myUsername) {
    window.location.href = 'index.html';
}

// Elementos del DOM
const myUsernameDisplay = document.getElementById('my-username');
const usersList = document.getElementById('users-list');
const messagesArea = document.getElementById('messages-area');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const logoutBtn = document.getElementById('logout-btn');

// Elementos de audio para los sonidos
const soundSend = document.getElementById('sound-send');
const soundReceive = document.getElementById('sound-receive');

// Mostrar mi nombre en el sidebar
myUsernameDisplay.textContent = `👤 ${myUsername}`;

// ==========================================
// FUNCIONES
// ==========================================

// Función auxiliar para reproducir sonidos sin errores
function playSound(audioElement) {
    audioElement.currentTime = 0; // Reinicia el sonido por si se manda muy rápido
    audioElement.play().catch(e => console.log("El navegador bloqueó el audio:", e));
}

// Función para agregar un mensaje al chat
function addMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    // Si el mensaje es mío, agregar clase especial
    if (data.username === myUsername) {
        messageDiv.classList.add('my-message');
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${data.username}</span>
            <span class="message-time">${data.time}</span>
        </div>
        <div class="message-content">${data.message}</div>
    `;
    
    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight; // Auto-scroll al final
}

// Función para agregar un archivo al chat
function addFileMessage(data) {
    const fileDiv = document.createElement('div');
    fileDiv.classList.add('message');
    
    if (data.username === myUsername) {
        fileDiv.classList.add('my-message');
    }
    
    let fileContent = '';
    
    // Si es imagen, mostrarla
    if (data.mimetype.startsWith('image/')) {
        fileContent = `<img src="/uploads/${data.filename}" alt="${data.originalname}" class="file-image">`;
    }
    // Si es video, mostrarlo
    else if (data.mimetype.startsWith('video/')) {
        fileContent = `<video src="/uploads/${data.filename}" controls class="file-video"></video>`;
    }
    // Si es audio, reproducirlo
    else if (data.mimetype.startsWith('audio/')) {
        fileContent = `<audio src="/uploads/${data.filename}" controls class="file-audio"></audio>`;
    }
    // Otros archivos: mostrar link de descarga
    else {
        fileContent = `<a href="/uploads/${data.filename}" download="${data.originalname}" class="file-link">📎 ${data.originalname}</a>`;
    }
    
    fileDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${data.username}</span>
            <span class="message-time">${data.time}</span>
        </div>
        <div class="message-content file-content">
            ${fileContent}
        </div>
    `;
    
    messagesArea.appendChild(fileDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Función para actualizar la lista de usuarios
function updateUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        if (user === myUsername) {
            li.classList.add('me');
            li.textContent += ' (yo)';
        }
        usersList.appendChild(li);
    });
}

// Función para enviar mensaje de texto
function sendMessage() {
    const message = messageInput.value.trim();
    if (message !== '') {
        socket.emit('chatMessage', { message: message });
        playSound(soundSend); // 👈 Sonido al enviar
        messageInput.value = '';
    }
}

// Función para enviar archivo
async function sendFile() {
    const file = fileInput.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            socket.emit('sendFile', {
                filename: result.filename,
                originalname: result.originalname,
                mimetype: result.mimetype
            });
        }
    } catch (error) {
        console.error('Error al subir archivo:', error);
    }
    
    // Limpiar el input
    fileInput.value = '';
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// ==========================================
// EVENTOS
// ==========================================

// Enviar mensaje con click
sendBtn.addEventListener('click', sendMessage);

// Enviar mensaje con Enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Seleccionar archivo
fileInput.addEventListener('change', sendFile);

// Cerrar sesión
logoutBtn.addEventListener('click', logout);

// ==========================================
// EVENTOS DE SOCKET.IO
// ==========================================

// Cuando me registro, enviar mi nombre
socket.emit('register', myUsername);

// Recibir lista de usuarios
socket.on('userList', (users) => {
    updateUsersList(users);
});

// Recibir mensaje de texto
socket.on('chatMessage', (data) => {
    addMessage(data);
    // Reproducir sonido SOLO si el mensaje es de OTRA persona
    if (data.username !== myUsername) {
        playSound(soundReceive); // 👈 Sonido al recibir
    }
});

// Recibir archivo
socket.on('receiveFile', (data) => {
    addFileMessage(data);
    // Reproducir sonido SOLO si el archivo es de OTRA persona
    if (data.username !== myUsername) {
        playSound(soundReceive); // 👈 Sonido al recibir
    }
});