// Lobby screen logic
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room') || localStorage.getItem('currentRoom');

    if (!roomCode) {
        window.location.href = 'index.html';
        return;
    }

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer.playerId) {
        window.location.href = 'index.html';
        return;
    }

    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const playersList = document.getElementById('playersList');
    const playerCount = document.getElementById('playerCount');
    const startGameBtn = document.getElementById('startGameBtn');
    const leaveBtn = document.getElementById('leaveBtn');
    const waitingMessage = document.getElementById('waitingMessage');

    let isHost = false;
    let players = [];

    // Display room code
    roomCodeDisplay.textContent = roomCode;

    // Load initial room data
    await loadRoomData();

    // Subscribe to player changes
    const playersChannel = supabase
        .channel(`room-${roomCode}`)
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'players',
                filter: `room_id=eq.${roomCode}`
            }, 
            (payload) => {
                console.log('Player change:', payload);
                loadRoomData();
            }
        )
        .on('postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomCode}`
            },
            (payload) => {
                console.log('Room state change:', payload);
                if (payload.new.state === 'submission') {
                    // Game started, redirect to game
                    window.location.href = `game.html?room=${roomCode}`;
                }
            }
        )
        .subscribe();

    // Load room data
    async function loadRoomData() {
        try {
            // Get room info
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomCode)
                .single();

            if (roomError) throw roomError;

            // Check if current player is host
            isHost = room.host_id === currentPlayer.playerId;

            // Get players
            const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select('*')
                .eq('room_id', roomCode)
                .order('created_at', { ascending: true });

            if (playersError) throw playersError;

            players = playersData;
            renderPlayers();

            // Show start button if host
            if (isHost) {
                startGameBtn.style.display = 'block';
                waitingMessage.style.display = 'none';
                startGameBtn.disabled = players.length < 2;
            } else {
                startGameBtn.style.display = 'none';
                waitingMessage.style.display = 'block';
            }

        } catch (error) {
            console.error('Error loading room data:', error);
        }
    }

    // Render players
    function renderPlayers() {
        playerCount.textContent = players.length;
        playersList.innerHTML = '';

        players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            
            // Get room data to check host
            supabase
                .from('rooms')
                .select('host_id')
                .eq('id', roomCode)
                .single()
                .then(({ data }) => {
                    if (data && data.host_id === player.player_id) {
                        playerCard.classList.add('is-host');
                    }
                });

            playerCard.innerHTML = `
                <img src="${player.avatar_url}" alt="${player.name}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">
                        ${player.name}
                        ${player.player_id === currentPlayer.playerId ? '(You)' : ''}
                    </div>
                </div>
            `;

            playersList.appendChild(playerCard);
        });
    }

    // Start game
    startGameBtn.addEventListener('click', async () => {
        if (players.length < 2) {
            alert('Need at least 2 players to start');
            return;
        }

        try {
            startGameBtn.disabled = true;
            startGameBtn.textContent = 'Starting...';

            // Update room state to submission
            const { error } = await supabase
                .from('rooms')
                .update({ state: 'submission' })
                .eq('id', roomCode);

            if (error) throw error;

            // All players will be redirected via realtime subscription
            window.location.href = `game.html?room=${roomCode}`;

        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to start game');
            startGameBtn.disabled = false;
            startGameBtn.textContent = 'Start Game';
        }
    });

    // Leave game
    leaveBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to leave?')) {
            try {
                // Remove player from room
                await supabase
                    .from('players')
                    .delete()
                    .eq('room_id', roomCode)
                    .eq('player_id', currentPlayer.playerId);

                // If host, delete room
                if (isHost) {
                    await supabase
                        .from('rooms')
                        .delete()
                        .eq('id', roomCode);
                }

                localStorage.removeItem('currentRoom');
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Error leaving room:', error);
                window.location.href = 'index.html';
            }
        }
    });
});
