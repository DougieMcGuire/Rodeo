// Game selection screen
const playerData = getPlayerData();

if (!playerData || !playerData.name) {
    window.location.href = 'index.html';
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
        
        // Disable all cards while processing
        document.querySelectorAll('.game-card').forEach(c => c.style.pointerEvents = 'none');
        
        try {
            console.log('Creating room for game:', gameType);
            
            // Use existing player ID from localStorage, don't generate new one
            const playerId = playerData.playerId;
            const roomCode = generateRoomCode();
            
            console.log('Room code:', roomCode);
            console.log('Player ID:', playerId);
            
            // Just use the avatar URL as-is (base64 from localStorage)
            const avatarUrl = playerData.avatarUrl;
            
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
                name: playerData.name,
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
            alert('Error: ' + error.message + '\n\nCheck console for details.');
            // Re-enable cards
            document.querySelectorAll('.game-card').forEach(c => c.style.pointerEvents = 'auto');
        }
    });
});

// Back button
document.getElementById('backToHomeBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});
