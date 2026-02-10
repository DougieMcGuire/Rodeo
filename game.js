// Game screen logic
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

    // UI Elements
    const submissionPhase = document.getElementById('submissionPhase');
    const gameplayPhase = document.getElementById('gameplayPhase');
    const submissionForm = document.getElementById('submissionForm');
    const submitPromptsBtn = document.getElementById('submitPromptsBtn');
    const submittedCount = document.getElementById('submittedCount');
    const totalPlayers = document.getElementById('totalPlayers');
    const waitingForOthers = document.getElementById('waitingForOthers');
    const leaveGameBtn = document.getElementById('leaveGameBtn');

    // Gameplay elements
    const wheelSection = document.getElementById('wheelSection');
    const selectionScreen = document.getElementById('selectionScreen');
    const promptDisplay = document.getElementById('promptDisplay');
    const gameOver = document.getElementById('gameOver');
    const spinWheelBtn = document.getElementById('spinWheelBtn');
    const chooseTruthBtn = document.getElementById('chooseTruthBtn');
    const chooseDareBtn = document.getElementById('chooseDareBtn');
    const doneBtn = document.getElementById('doneBtn');
    const backToLobbyBtn = document.getElementById('backToLobbyBtn');

    let players = [];
    let currentPhase = 'submission';
    let currentSelectedPlayer = null;
    let allPrompts = [];

    // Initialize
    await init();

    async function init() {
        // Get room state
        const { data: room } = await supabase
            .from('rooms')
            .select('state')
            .eq('id', roomCode)
            .single();

        if (!room) {
            window.location.href = 'index.html';
            return;
        }

        currentPhase = room.state;

        // Get all players
        const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', roomCode);

        players = playersData || [];
        totalPlayers.textContent = players.length;

        if (currentPhase === 'submission') {
            showSubmissionPhase();
        } else if (currentPhase === 'playing') {
            showGameplayPhase();
        }

        // Subscribe to changes
        subscribeToChanges();
    }

    // SUBMISSION PHASE
    async function showSubmissionPhase() {
        submissionPhase.style.display = 'block';
        gameplayPhase.style.display = 'none';

        // Check if already submitted
        const { data: currentPlayerData } = await supabase
            .from('players')
            .select('has_submitted')
            .eq('room_id', roomCode)
            .eq('player_id', currentPlayer.playerId)
            .single();

        if (currentPlayerData?.has_submitted) {
            showWaitingForOthers();
            return;
        }

        // Generate submission form
        const otherPlayers = players.filter(p => p.player_id !== currentPlayer.playerId);
        
        submissionForm.innerHTML = '';
        otherPlayers.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-submission';
            playerDiv.innerHTML = `
                <div class="player-submission-header">
                    <img src="${player.avatar_url}" alt="${player.name}" class="small-avatar">
                    <h3>${player.name}</h3>
                </div>
                <div class="prompt-inputs">
                    <textarea 
                        id="truth-${player.player_id}" 
                        placeholder="Write a truth for ${player.name}..."
                        required
                    ></textarea>
                    <textarea 
                        id="dare-${player.player_id}" 
                        placeholder="Write a dare for ${player.name}..."
                        required
                    ></textarea>
                </div>
            `;
            submissionForm.appendChild(playerDiv);
        });

        submitPromptsBtn.style.display = 'block';
    }

    submitPromptsBtn.addEventListener('click', async () => {
        const otherPlayers = players.filter(p => p.player_id !== currentPlayer.playerId);
        const prompts = [];

        // Collect all inputs
        for (const player of otherPlayers) {
            const truthInput = document.getElementById(`truth-${player.player_id}`);
            const dareInput = document.getElementById(`dare-${player.player_id}`);

            const truth = truthInput.value.trim();
            const dare = dareInput.value.trim();

            if (!truth || !dare) {
                alert('Please fill in all truths and dares');
                return;
            }

            prompts.push({
                room_id: roomCode,
                from_player: currentPlayer.playerId,
                to_player: player.player_id,
                type: 'truth',
                text: truth,
                used: false
            });

            prompts.push({
                room_id: roomCode,
                from_player: currentPlayer.playerId,
                to_player: player.player_id,
                type: 'dare',
                text: dare,
                used: false
            });
        }

        try {
            submitPromptsBtn.disabled = true;
            submitPromptsBtn.textContent = 'Submitting...';

            // Insert prompts
            const { error: promptsError } = await supabase
                .from('prompts')
                .insert(prompts);

            if (promptsError) throw promptsError;

            // Mark player as submitted
            const { error: playerError } = await supabase
                .from('players')
                .update({ has_submitted: true })
                .eq('room_id', roomCode)
                .eq('player_id', currentPlayer.playerId);

            if (playerError) throw playerError;

            showWaitingForOthers();

        } catch (error) {
            console.error('Error submitting prompts:', error);
            alert('Failed to submit. Please try again.');
            submitPromptsBtn.disabled = false;
            submitPromptsBtn.textContent = 'Submit All';
        }
    });

    function showWaitingForOthers() {
        submissionForm.style.display = 'none';
        submitPromptsBtn.style.display = 'none';
        waitingForOthers.style.display = 'block';
        updateSubmissionCount();
    }

    async function updateSubmissionCount() {
        const { data } = await supabase
            .from('players')
            .select('has_submitted')
            .eq('room_id', roomCode)
            .eq('has_submitted', true);

        submittedCount.textContent = data?.length || 0;
    }

    // GAMEPLAY PHASE
    async function showGameplayPhase() {
        submissionPhase.style.display = 'none';
        gameplayPhase.style.display = 'block';

        // Load all prompts
        const { data: promptsData } = await supabase
            .from('prompts')
            .select('*')
            .eq('room_id', roomCode);

        allPrompts = promptsData || [];

        // Show wheel
        wheelSection.style.display = 'block';
        selectionScreen.style.display = 'none';
        promptDisplay.style.display = 'none';
        gameOver.style.display = 'none';

        drawWheel();
    }

    // Wheel drawing and spinning
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas?.getContext('2d');
    let currentRotation = 0;

    function drawWheel() {
        if (!ctx || players.length === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 150;
        const sliceAngle = (2 * Math.PI) / players.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw slices
        players.forEach((player, i) => {
            const startAngle = currentRotation + i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // Slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Color
            const hue = (i * 360) / players.length;
            ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(player.name, radius * 0.65, 5);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    spinWheelBtn.addEventListener('click', () => {
        spinWheel();
    });

    function spinWheel() {
        spinWheelBtn.disabled = true;
        
        const spinDuration = 3000;
        const rotations = 5 + Math.random() * 3;
        const targetRotation = currentRotation + (rotations * 2 * Math.PI);
        const startTime = Date.now();
        const startRotation = currentRotation;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Easing
            const easeOut = 1 - Math.pow(1 - progress, 3);
            currentRotation = startRotation + (targetRotation - startRotation) * easeOut;

            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                selectPlayerFromWheel();
            }
        }

        animate();
    }

    function selectPlayerFromWheel() {
        const sliceAngle = (2 * Math.PI) / players.length;
        const normalizedRotation = (currentRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = (Math.PI / 2) - normalizedRotation;
        const normalizedPointer = (pointerAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const selectedIndex = Math.floor(normalizedPointer / sliceAngle);
        
        currentSelectedPlayer = players[selectedIndex];
        showSelectionScreen();
    }

    async function showSelectionScreen() {
        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'block';

        document.getElementById('selectedPlayerAvatar').src = currentSelectedPlayer.avatar_url;
        document.getElementById('selectedPlayerName').textContent = currentSelectedPlayer.name;

        // Count available prompts
        const availableTruths = allPrompts.filter(p => 
            p.to_player === currentSelectedPlayer.player_id && 
            p.type === 'truth' && 
            !p.used
        ).length;

        const availableDares = allPrompts.filter(p => 
            p.to_player === currentSelectedPlayer.player_id && 
            p.type === 'dare' && 
            !p.used
        ).length;

        document.getElementById('truthCount').textContent = `${availableTruths} available`;
        document.getElementById('dareCount').textContent = `${availableDares} available`;

        chooseTruthBtn.disabled = availableTruths === 0;
        chooseDareBtn.disabled = availableDares === 0;

        // Check if game over
        if (availableTruths === 0 && availableDares === 0) {
            showGameOver();
        }
    }

    chooseTruthBtn.addEventListener('click', () => selectPrompt('truth'));
    chooseDareBtn.addEventListener('click', () => selectPrompt('dare'));

    async function selectPrompt(type) {
        const availablePrompts = allPrompts.filter(p => 
            p.to_player === currentSelectedPlayer.player_id && 
            p.type === type && 
            !p.used
        );

        if (availablePrompts.length === 0) return;

        const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];

        // Mark as used
        const { error } = await supabase
            .from('prompts')
            .update({ used: true })
            .eq('id', selectedPrompt.id);

        if (!error) {
            // Update local state
            const promptIndex = allPrompts.findIndex(p => p.id === selectedPrompt.id);
            if (promptIndex !== -1) {
                allPrompts[promptIndex].used = true;
            }

            showPrompt(selectedPrompt);
        }
    }

    function showPrompt(prompt) {
        selectionScreen.style.display = 'none';
        promptDisplay.style.display = 'block';

        document.getElementById('promptType').textContent = prompt.type.toUpperCase();
        document.getElementById('promptText').textContent = prompt.text;
    }

    doneBtn.addEventListener('click', () => {
        // Check if all prompts are used
        const remainingPrompts = allPrompts.filter(p => !p.used);
        
        if (remainingPrompts.length === 0) {
            showGameOver();
        } else {
            promptDisplay.style.display = 'none';
            wheelSection.style.display = 'block';
            spinWheelBtn.disabled = false;
        }
    });

    function showGameOver() {
        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'none';
        promptDisplay.style.display = 'none';
        gameOver.style.display = 'block';
    }

    backToLobbyBtn.addEventListener('click', async () => {
        // Reset room state
        await supabase
            .from('rooms')
            .update({ state: 'lobby' })
            .eq('id', roomCode);

        // Reset players
        await supabase
            .from('players')
            .update({ has_submitted: false })
            .eq('room_id', roomCode);

        // Delete all prompts
        await supabase
            .from('prompts')
            .delete()
            .eq('room_id', roomCode);

        window.location.href = `lobby.html?room=${roomCode}`;
    });

    // Subscribe to realtime changes
    function subscribeToChanges() {
        const channel = supabase
            .channel(`game-${roomCode}`)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'players',
                    filter: `room_id=eq.${roomCode}`
                },
                async (payload) => {
                    console.log('Player updated:', payload);
                    await updateSubmissionCount();
                    
                    // Check if all submitted
                    const { data } = await supabase
                        .from('players')
                        .select('has_submitted')
                        .eq('room_id', roomCode);

                    const allSubmitted = data && data.every(p => p.has_submitted);
                    
                    if (allSubmitted && currentPhase === 'submission') {
                        // Update room state to playing
                        const { data: roomData } = await supabase
                            .from('rooms')
                            .select('state')
                            .eq('id', roomCode)
                            .single();

                        if (roomData.state === 'submission') {
                            await supabase
                                .from('rooms')
                                .update({ state: 'playing' })
                                .eq('id', roomCode);
                        }
                    }
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
                    console.log('Room updated:', payload);
                    if (payload.new.state === 'playing' && currentPhase === 'submission') {
                        currentPhase = 'playing';
                        showGameplayPhase();
                    }
                }
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'prompts',
                    filter: `room_id=eq.${roomCode}`
                },
                async (payload) => {
                    console.log('Prompt updated:', payload);
                    // Reload prompts
                    const { data: promptsData } = await supabase
                        .from('prompts')
                        .select('*')
                        .eq('room_id', roomCode);

                    allPrompts = promptsData || [];
                }
            )
            .subscribe();
    }

    // Leave game
    leaveGameBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to leave?')) {
            await supabase
                .from('players')
                .delete()
                .eq('room_id', roomCode)
                .eq('player_id', currentPlayer.playerId);

            localStorage.removeItem('currentRoom');
            window.location.href = 'index.html';
        }
    });
});
