// Game logic
console.log('game.js loaded');

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room') || getCurrentRoom();
const playerData = getPlayerData();

if (!roomCode || !playerData) {
    console.error('Missing room or player data');
    window.location.href = 'index.html';
}

console.log('Game starting for room:', roomCode);
console.log('Player:', playerData);

// UI Elements
const gameTitle = document.getElementById('gameTitle');
const gameContent = document.getElementById('gameContent');
const leaveGameBtn = document.getElementById('leaveGameBtn');

let gameType = null;
let gameMode = null;
let players = [];
let isHost = false;

// Listen for room data
database.ref('rooms/' + roomCode).on('value', (snapshot) => {
    const room = snapshot.val();
    
    if (!room) {
        console.log('Room deleted, going home');
        clearCurrentRoom();
        window.location.href = 'index.html';
        return;
    }
    
    gameType = room.gameType;
    gameMode = room.gameMode;
    isHost = (room.hostId === playerData.playerId);
    
    console.log('Game type:', gameType);
    console.log('Game mode:', gameMode);
    console.log('Is host:', isHost);
    
    // Update title
    const gameNames = {
        'truth-or-dare': '🤠 Truth or Dare',
        'charades': '🎭 Charades',
        'would-you-rather': '🤔 Would You Rather',
        'wavelength': '📡 Wavelength',
        'roulette': '🎰 Roulette',
        'misfit': '🕵️ Misfit'
    };
    
    gameTitle.textContent = gameNames[gameType] || 'Game';
    
    // Initialize the specific game
    initGame();
});

// Listen for players
database.ref('rooms/' + roomCode + '/players').on('value', (snapshot) => {
    const playersData = snapshot.val();
    
    if (!playersData) {
        console.log('No players, going home');
        clearCurrentRoom();
        window.location.href = 'index.html';
        return;
    }
    
    players = Object.values(playersData).sort((a, b) => a.joinOrder - b.joinOrder);
    console.log('Players:', players);
});

function initGame() {
    console.log('Initializing game:', gameType);
    
    // For now, just show a placeholder for each game
    switch(gameType) {
        case 'truth-or-dare':
            gameContent.innerHTML = '<h2>🤠 Truth or Dare</h2><p>Game coming soon!</p>';
            break;
        case 'charades':
            gameContent.innerHTML = '<h2>🎭 Charades</h2><p>Game coming soon!</p>';
            break;
        case 'would-you-rather':
            gameContent.innerHTML = '<h2>🤔 Would You Rather</h2><p>Game coming soon!</p>';
            break;
        case 'wavelength':
            gameContent.innerHTML = '<h2>📡 Wavelength</h2><p>Game coming soon!</p>';
            break;
        case 'roulette':
            gameContent.innerHTML = '<h2>🎰 Roulette</h2><p>Game coming soon!</p>';
            break;
        case 'misfit':
            gameContent.innerHTML = '<h2>🕵️ Misfit</h2><p>Game coming soon!</p>';
            break;
        default:
            gameContent.innerHTML = '<p>Unknown game type</p>';
    }
}

// Leave game
leaveGameBtn.addEventListener('click', async () => {
    try {
        if (isHost) {
            // Host leaving = delete room
            await database.ref('rooms/' + roomCode).remove();
        } else {
            // Remove player
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

console.log('game.js initialized');
