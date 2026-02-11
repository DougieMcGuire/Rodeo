// Lobby logic
console.log('lobby.js loaded');

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room') || getCurrentRoom();
const playerData = getPlayerData();

if (!roomCode || !playerData) {
    console.error('Missing room or player data');
    window.location.href = 'index.html';
}

console.log('Room code:', roomCode);
console.log('Player data:', playerData);

// UI Elements
const roomCodeDisplay = document.getElementById('roomCode');
const playersList = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn');
const hostControls = document.getElementById('hostControls');
const leaveBtn = document.getElementById('leaveBtn');

// Display room code
roomCodeDisplay.textContent = roomCode.substr(0, 3) + ' ' + roomCode.substr(3);

// Listen for players
database.ref('rooms/' + roomCode + '/players').on('value', (snapshot) => {
    const players = snapshot.val();
    console.log('Players updated:', players);
    
    if (!players) {
        console.log('No players, redirecting home');
        window.location.href = 'index.html';
        return;
    }
    
    // Convert to array and sort by join order
    const playersArray = Object.values(players).sort((a, b) => a.joinOrder - b.joinOrder);
    
    // Render players
    playersList.innerHTML = '';
    playersArray.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        if (player.isHost) {
            playerCard.classList.add('is-host');
        }
        
        playerCard.innerHTML = `
            <img src="${player.avatarUrl}" alt="${player.name}" class="player-avatar-small">
            <span class="player-name">${player.name}</span>
            ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
        `;
        
        playersList.appendChild(playerCard);
    });
    
    // Show start button if current player is host
    const currentPlayer = playersArray.find(p => p.playerId === playerData.playerId);
    if (currentPlayer && currentPlayer.isHost) {
        hostControls.style.display = 'block';
    }
});

// Start game button
startGameBtn.addEventListener('click', async () => {
    try {
        startGameBtn.disabled = true;
        startGameBtn.textContent = 'STARTING...';
        
        // Update room state to playing
        await database.ref('rooms/' + roomCode).update({
            state: 'playing'
        });
        
        window.location.href = `game.html?room=${roomCode}`;
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game');
        startGameBtn.disabled = false;
        startGameBtn.textContent = 'START GAME';
    }
});

// Leave button
leaveBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to leave?')) {
        try {
            // Remove player from room
            await database.ref('rooms/' + roomCode + '/players/' + playerData.playerId).remove();
            clearCurrentRoom();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error leaving:', error);
            window.location.href = 'index.html';
        }
    }
});

console.log('lobby.js initialized');
