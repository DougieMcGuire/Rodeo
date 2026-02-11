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
            await supabase
                .from('rooms')
                .update({ 
                    game_mode: selectedMode,
                    state: 'lobby'
                })
                .eq('id', roomCode);

            // Initialize game state
            await supabase
                .from('game_state')
                .upsert({
                    room_id: roomCode,
                    game_type: gameType,
                    current_data: {}
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
        // Delete room and players
        await supabase.from('rooms').delete().eq('id', roomCode);
        clearCurrentRoom();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'index.html';
    }
});
