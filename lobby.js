// Lobby logic
console.log('lobby.js loaded');

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room') || getCurrentRoom();
const playerData = getPlayerData();

console.log('=== LOBBY DEBUG ===');
console.log('Room code from URL:', urlParams.get('room'));
console.log('Room code from storage:', getCurrentRoom());
console.log('Final room code:', roomCode);
console.log('Player data:', playerData);

if (!roomCode) {
    console.error('NO ROOM CODE - redirecting to home');
    window.location.href = 'index.html';
}

if (!playerData) {
    console.error('NO PLAYER DATA - redirecting to home');
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

let isHost = false;
let hostId = null;

// Listen for room data (game type, mode, host)
database.ref('rooms/' + roomCode).on('value', (snapshot) => {
    console.log('Room data received:', snapshot.val());
    const room = snapshot.val();
    if (room) {
        hostId = room.hostId;
        isHost = (hostId === playerData.playerId);
        
        console.log('Host ID:', hostId);
        console.log('Current player ID:', playerData.playerId);
        console.log('Is host:', isHost);
        console.log('Room state:', room.state);
        
        // If room state changed to playing, redirect everyone to game
        if (room.state === 'playing') {
            console.log('Game starting! Redirecting to game screen...');
            window.location.href = `game.html?room=${roomCode}`;
            return;
        }
        
        // Update game info display
        const gameNames = {
            'truth-or-dare': '🤠 Truth or Dare',
            'charades': '🎭 Charades',
            'would-you-rather': '🤔 Would You Rather',
            'wavelength': '📡 Wavelength',
            'roulette': '🎰 Roulette',
            'misfit': '🕵️ Misfit'
        };
        
        const modeNames = {
            'family': 'Family',
            'friends': 'Friends',
            'freaky': 'Freaky',
            'party': 'Party'
        };
        
        const gameName = gameNames[room.gameType] || room.gameType;
        const modeName = modeNames[room.gameMode] || room.gameMode;
        
        document.querySelector('.game-title').textContent = `${gameName} - ${modeName} Mode`;
        
        // Show start button if host
        if (isHost) {
            console.log('SHOWING START BUTTON - Current player is host');
            hostControls.style.display = 'block';
        } else {
            console.log('Hiding start button - not host');
            hostControls.style.display = 'none';
        }
    } else {
        console.error('Room data is null!');
    }
});

// Listen for players
database.ref('rooms/' + roomCode + '/players').on('value', (snapshot) => {
    const players = snapshot.val();
    console.log('Players data received:', players);
    
    if (!players) {
        console.log('NO PLAYERS - redirecting home');
        clearCurrentRoom();
        window.location.href = 'index.html';
        return;
    }
    
    // Convert to array and sort by join order
    const playersArray = Object.values(players).sort((a, b) => a.joinOrder - b.joinOrder);
    console.log('Players array:', playersArray);
    
    // Check if current player is still in the room
    const currentPlayerInRoom = playersArray.find(p => p.playerId === playerData.playerId);
    console.log('Current player in room:', currentPlayerInRoom);
    
    if (!currentPlayerInRoom) {
        console.log('CURRENT PLAYER NOT IN ROOM - redirecting home');
        clearCurrentRoom();
        window.location.href = 'index.html';
        return;
    }
    
    // Render players
    playersList.innerHTML = '';
    playersArray.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        if (player.playerId === hostId) {
            playerCard.classList.add('is-host');
        }
        
        playerCard.innerHTML = `
            <img src="${player.avatarUrl}" alt="${player.name}" class="player-avatar-small">
            <span class="player-name">${player.name}</span>
            ${player.playerId === hostId ? '<span class="host-badge">HOST</span>' : ''}
        `;
        
        playersList.appendChild(playerCard);
    });
    
    console.log('Players rendered successfully');
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

// Leave button - no confirmation popup
leaveBtn.addEventListener('click', async () => {
    try {
        // If host is leaving, delete entire room
        if (isHost) {
            await database.ref('rooms/' + roomCode).remove();
        } else {
            // Remove player from room
            await database.ref('rooms/' + roomCode + '/players/' + playerData.playerId).remove();
        }
        clearCurrentRoom();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error leaving:', error);
        clearCurrentRoom();
        window.location.href = 'index.html';
    }
});

console.log('lobby.js initialized');
