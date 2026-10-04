// Conectar con el servidor de Socket.io
const socket = io();

const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('join-btn');

// Función para unirse al chat
function joinChat() {
    const username = usernameInput.value.trim();
    
    if (username !== '') {
        // Enviar el nombre al servidor
        socket.emit('register', username);
        
        // Guardar el nombre en el navegador para usarlo en chat.html
        localStorage.setItem('username', username);
        
        // Redirigir a la pantalla del chat
        window.location.href = 'chat.html';
    } else {
        alert('Por favor, escribe un nombre de usuario');
    }
}

// Evento click en el botón
joinBtn.addEventListener('click', joinChat);

// Evento Enter en el input
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinChat();
    }
});