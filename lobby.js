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

let isHost = false;
let hostId = null;
let hostCheckTimeout = null;

// Listen for room data (game type, mode, host)
database.ref('rooms/' + roomCode).on('value', (snapshot) => {
    const room = snapshot.val();
    if (room) {
        hostId = room.hostId;
        isHost = (hostId === playerData.playerId);
        
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
            console.log('Current player is host');
            hostControls.style.display = 'block';
        } else {
            hostControls.style.display = 'none';
        }
    }
});

// Listen for players
database.ref('rooms/' + roomCode + '/players').on('value', (snapshot) => {
    const players = snapshot.val();
    console.log('Players updated:', players);
    
    if (!players) {
        console.log('No players, redirecting home');
        clearCurrentRoom();
        window.location.href = 'index.html';
        return;
    }
    
    // Convert to array and sort by join order
    const playersArray = Object.values(players).sort((a, b) => a.joinOrder - b.joinOrder);
    
    // Check if current player is still in the room
    const currentPlayerInRoom = playersArray.find(p => p.playerId === playerData.playerId);
    if (!currentPlayerInRoom) {
        console.log('Current player not in room, redirecting home');
        clearCurrentRoom();
        window.location.href = 'index.html';
        return;
    }
    
    // If host left, wait 3 seconds before ending game (gives time for page transitions)
    const hostStillHere = playersArray.find(p => p.playerId === hostId);
    if (!hostStillHere && !isHost) {
        // Clear any existing timeout
        if (hostCheckTimeout) {
            clearTimeout(hostCheckTimeout);
        }
        
        console.log('Host not in player list, checking in 3 seconds...');
        
        // Wait 3 seconds then check again
        hostCheckTimeout = setTimeout(() => {
            database.ref('rooms/' + roomCode + '/players').once('value', (checkSnapshot) => {
                const currentPlayers = checkSnapshot.val();
                if (!currentPlayers) {
                    clearCurrentRoom();
                    window.location.href = 'index.html';
                    return;
                }
                
                const playersCheck = Object.values(currentPlayers);
                const hostCheck = playersCheck.find(p => p.playerId === hostId);
                
                if (!hostCheck) {
                    console.log('Host still gone after 3 seconds, ending game');
                    clearCurrentRoom();
                    alert('Host left the game');
                    window.location.href = 'index.html';
                }
            });
        }, 3000);
    } else {
        // Host is here, clear any pending timeout
        if (hostCheckTimeout) {
            clearTimeout(hostCheckTimeout);
            hostCheckTimeout = null;
        }
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

// Handle tab close / page unload - remove player automatically
window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliable cleanup on page close
    if (isHost) {
        // Host leaving = delete room
        database.ref('rooms/' + roomCode).remove();
    } else {
        // Regular player = just remove them
        database.ref('rooms/' + roomCode + '/players/' + playerData.playerId).remove();
    }
});

console.log('lobby.js initialized');
