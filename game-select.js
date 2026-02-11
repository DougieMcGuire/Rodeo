// Game selection screen
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room');
const playerData = getPlayerData();

if (!roomCode || !playerData) {
    window.location.href = 'index.html';
}

let selectedMode = 'friends';

// Mode selection
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
    });
});

// Game selection
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', async () => {
        const gameType = card.dataset.game;
        
        try {
            // Update room with game type and mode
            await database.ref('rooms/' + roomCode).update({
                gameMode: selectedMode,
                state: 'lobby',
                gameType: gameType
            });

            window.location.href = `lobby.html?room=${roomCode}`;
        } catch (error) {
            console.error('Error selecting game:', error);
            alert('Failed to select game');
        }
    });
});

// Back button
document.getElementById('backToHomeBtn').addEventListener('click', async () => {
    try {
        // Delete room
        await database.ref('rooms/' + roomCode).remove();
        clearCurrentRoom();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'index.html';
    }
});
