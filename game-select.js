// Game selection screen
const playerData = getPlayerData();

// Better validation
if (!playerData || !playerData.name || !playerData.playerId) {
    console.error('Missing player data:', playerData);
    alert('Player data not loaded. Please try again.');
    window.location.href = 'index.html';
    throw new Error('Player data incomplete'); // Stop execution
}

let selectedMode = 'friends';
let selectedFile = null;

// Check if there's a selected file in the session
const avatarPreview = playerData.avatarUrl;

// Mode selection
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
    });
});

// Game selection - NOW creates the room
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', async () => {
        const gameType = card.dataset.game;
        
        // Double-check player data before proceeding
        const currentPlayerData = getPlayerData();
        if (!currentPlayerData || !currentPlayerData.playerId) {
            alert('Player data lost. Please restart.');
            window.location.href = 'index.html';
            return;
        }
        
        // Disable all cards while processing
        document.querySelectorAll('.game-card').forEach(c => c.style.pointerEvents = 'none');
        
        try {
            console.log('Creating room for game:', gameType);
            
            // Use existing player ID from localStorage, don't generate new one
            const playerId = currentPlayerData.playerId;
            const roomCode = generateRoomCode();
            
            console.log('Room code:', roomCode);
            console.log('Player ID:', playerId);
            console.log('Player name:', currentPlayerData.name);
            
            // Validate all required data
            if (!playerId || !currentPlayerData.name || !currentPlayerData.avatarUrl) {
                throw new Error('Missing required player data: ' + JSON.stringify({
                    hasId: !!playerId,
                    hasName: !!currentPlayerData.name,
                    hasAvatar: !!currentPlayerData.avatarUrl
                }));
            }
            
            // Just use the avatar URL as-is (base64 from localStorage)
            const avatarUrl = currentPlayerData.avatarUrl;
            
            console.log('Creating room in database...');
            
            // Create room with game info
            await database.ref('rooms/' + roomCode).set({
                hostId: playerId,
                state: 'lobby',
                gameType: gameType,
                gameMode: selectedMode,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('Room created in database');
            
            // Add player to room
            await database.ref('rooms/' + roomCode + '/players/' + playerId).set({
                playerId: playerId,
                name: currentPlayerData.name,
                avatarUrl: avatarUrl,
                joinOrder: 1,
                isHost: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('Player added to room');
            
            // Set up auto-cleanup when all players leave
            database.ref('rooms/' + roomCode + '/players').on('value', (snapshot) => {
                if (!snapshot.exists()) {
                    console.log('No players left, deleting room');
                    database.ref('rooms/' + roomCode).remove();
                }
            });
            
            setCurrentRoom(roomCode);
            console.log('Redirecting to lobby...');
            window.location.href = `lobby.html?room=${roomCode}`;
        } catch (error) {
            console.error('FULL ERROR:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            alert('Error creating room: ' + error.message + '\n\nCheck console for details.');
            // Re-enable cards
            document.querySelectorAll('.game-card').forEach(c => c.style.pointerEvents = 'auto');
        }
    });
});

// Back button
document.getElementById('backToHomeBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});