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
    let isHost = false;
    
    // Card submission state
    let currentCardIndex = 0;
    let submissionCards = [];
    let cardInputs = {};

    // Initialize
    await init();

    async function init() {
        // Get room state
        const { data: room } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomCode)
            .single();

        if (!room) {
            window.location.href = 'index.html';
            return;
        }

        currentPhase = room.state;
        isHost = room.host_id === currentPlayer.playerId;

        // Get all players
        const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', roomCode)
            .order('created_at', { ascending: true });

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

        // Generate submission cards (one card per prompt type per player)
        const otherPlayers = players.filter(p => p.player_id !== currentPlayer.playerId);
        submissionCards = [];
        
        otherPlayers.forEach(player => {
            submissionCards.push({ player, type: 'dare' });
            submissionCards.push({ player, type: 'truth' });
        });

        // Render cards
        renderSubmissionCards();
    }

    function renderSubmissionCards() {
        submissionForm.innerHTML = '';
        
        submissionCards.forEach((card, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-submission ${index === currentCardIndex ? 'active' : index < currentCardIndex ? 'prev' : 'next'}`;
            playerDiv.dataset.index = index;
            
            const typeLabel = card.type.charAt(0).toUpperCase() + card.type.slice(1);
            const placeholder = `Write a ${card.type} for ${card.player.name}...`;
            
            playerDiv.innerHTML = `
                <div class="player-submission-header">
                    <img src="${card.player.avatar_url}" alt="${card.player.name}" class="small-avatar">
                    <h3>${card.player.name}</h3>
                </div>
                <div class="prompt-type-label">${typeLabel}</div>
                <div class="prompt-inputs">
                    <textarea 
                        id="input-${index}" 
                        placeholder="${placeholder}"
                        data-player-id="${card.player.player_id}"
                        data-type="${card.type}"
                    ></textarea>
                </div>
            `;
            
            submissionForm.appendChild(playerDiv);
            
            // Restore saved input
            const savedValue = cardInputs[index];
            if (savedValue) {
                playerDiv.querySelector('textarea').value = savedValue;
            }
        });

        renderCardNavigation();
    }

    function renderCardNavigation() {
        // Remove old navigation if exists
        const oldNav = document.querySelector('.card-navigation');
        if (oldNav) oldNav.remove();

        const nav = document.createElement('div');
        nav.className = 'card-navigation';
        nav.innerHTML = `
            <button class="card-nav-btn" id="prevCardBtn" ${currentCardIndex === 0 ? 'disabled' : ''}>← Previous</button>
            <div class="card-progress">${currentCardIndex + 1} / ${submissionCards.length}</div>
            <button class="card-nav-btn" id="nextCardBtn">${currentCardIndex === submissionCards.length - 1 ? 'Submit All' : 'Next →'}</button>
        `;
        
        submissionForm.appendChild(nav);

        // Add event listeners
        document.getElementById('prevCardBtn').addEventListener('click', () => {
            saveCurrentCard();
            if (currentCardIndex > 0) {
                currentCardIndex--;
                updateCardDisplay();
            }
        });

        document.getElementById('nextCardBtn').addEventListener('click', async () => {
            saveCurrentCard();
            
            // Validate current card
            const currentTextarea = document.getElementById(`input-${currentCardIndex}`);
            if (!currentTextarea.value.trim()) {
                alert('Please fill in this prompt before continuing');
                return;
            }

            if (currentCardIndex === submissionCards.length - 1) {
                // Submit all
                await submitAllPrompts();
            } else {
                currentCardIndex++;
                updateCardDisplay();
            }
        });
    }

    function saveCurrentCard() {
        const textarea = document.getElementById(`input-${currentCardIndex}`);
        if (textarea) {
            cardInputs[currentCardIndex] = textarea.value;
        }
    }

    function updateCardDisplay() {
        document.querySelectorAll('.player-submission').forEach((card, index) => {
            card.classList.remove('active', 'prev', 'next');
            if (index === currentCardIndex) {
                card.classList.add('active');
            } else if (index < currentCardIndex) {
                card.classList.add('prev');
            } else {
                card.classList.add('next');
            }
        });
        
        renderCardNavigation();
    }

    async function submitAllPrompts() {
        // Validate all inputs
        for (let i = 0; i < submissionCards.length; i++) {
            if (!cardInputs[i] || !cardInputs[i].trim()) {
                alert('Please fill in all prompts');
                currentCardIndex = i;
                updateCardDisplay();
                return;
            }
        }

        const prompts = submissionCards.map((card, index) => ({
            room_id: roomCode,
            from_player: currentPlayer.playerId,
            to_player: card.player.player_id,
            type: card.type,
            text: cardInputs[index],
            used: false
        }));

        try {
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
        }
    }

    function showWaitingForOthers() {
        submissionForm.style.display = 'none';
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

        if (isHost) {
            // Host controls the wheel
            showWheelForHost();
        } else {
            // Other players wait
            showWaitingForSpin();
        }
    }

    function showWheelForHost() {
        wheelSection.style.display = 'block';
        selectionScreen.style.display = 'none';
        promptDisplay.style.display = 'none';
        gameOver.style.display = 'none';
        spinWheelBtn.disabled = false;
        drawWheel();
    }

    function showWaitingForSpin() {
        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'block';
        promptDisplay.style.display = 'none';
        gameOver.style.display = 'none';

        selectionScreen.innerHTML = `
            <div class="waiting-for-choice">
                <h3>Host is spinning the wheel...</h3>
                <div class="spinner"></div>
            </div>
        `;
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
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px sans-serif';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(player.name, radius * 0.65, 5);
            ctx.fillText(player.name, radius * 0.65, 5);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    spinWheelBtn.addEventListener('click', async () => {
        if (!isHost) return;
        
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

        // Broadcast spin to all players
        await supabase
            .from('game_state')
            .upsert({
                room_id: roomCode,
                spinning: true,
                current_player: null
            });
    });

    async function selectPlayerFromWheel() {
        const sliceAngle = (2 * Math.PI) / players.length;
        const normalizedRotation = (currentRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = (Math.PI / 2) - normalizedRotation;
        const normalizedPointer = (pointerAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const selectedIndex = Math.floor(normalizedPointer / sliceAngle);
        
        currentSelectedPlayer = players[selectedIndex];

        // Broadcast selected player
        await supabase
            .from('game_state')
            .upsert({
                room_id: roomCode,
                spinning: false,
                current_player: currentSelectedPlayer.player_id,
                last_spin_at: new Date().toISOString()
            });

        if (isHost) {
            showWaitingForPlayerChoice();
        }
    }

    function showWaitingForPlayerChoice() {
        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'block';

        selectionScreen.innerHTML = `
            <div class="waiting-for-choice">
                <h3>${currentSelectedPlayer.name} is choosing...</h3>
                <div class="spinner"></div>
            </div>
        `;
    }

    async function showSelectionScreen(playerId) {
        currentSelectedPlayer = players.find(p => p.player_id === playerId);
        if (!currentSelectedPlayer) return;

        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'block';
        promptDisplay.style.display = 'none';

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

        // Check if this player should choose
        if (currentPlayer.playerId === playerId) {
            selectionScreen.innerHTML = `
                <div class="selected-player">
                    <img src="${currentSelectedPlayer.avatar_url}" alt="${currentSelectedPlayer.name}">
                    <h2>${currentSelectedPlayer.name}</h2>
                </div>
                <p class="selection-prompt">Choose Truth or Dare</p>
                <div class="choice-buttons">
                    <button class="btn btn-choice" id="chooseTruthBtn" ${availableTruths === 0 ? 'disabled' : ''}>
                        <span class="choice-label">Truth</span>
                        <span class="choice-count">${availableTruths} available</span>
                    </button>
                    <button class="btn btn-choice" id="chooseDareBtn" ${availableDares === 0 ? 'disabled' : ''}>
                        <span class="choice-label">Dare</span>
                        <span class="choice-count">${availableDares} available</span>
                    </button>
                </div>
            `;

            document.getElementById('chooseTruthBtn').addEventListener('click', () => selectPrompt('truth'));
            document.getElementById('chooseDareBtn').addEventListener('click', () => selectPrompt('dare'));
        } else {
            selectionScreen.innerHTML = `
                <div class="waiting-for-choice">
                    <h3>${currentSelectedPlayer.name} is choosing...</h3>
                    <div class="spinner"></div>
                </div>
            `;
        }

        // Check if game over
        if (availableTruths === 0 && availableDares === 0) {
            showGameOver();
        }
    }

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

            // Broadcast prompt selection
            await supabase
                .from('game_state')
                .update({ 
                    selected_prompt_id: selectedPrompt.id,
                    selected_type: type
                })
                .eq('room_id', roomCode);

            showPrompt(selectedPrompt);
        }
    }

    function showPrompt(prompt) {
        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'none';
        promptDisplay.style.display = 'block';

        document.getElementById('promptType').textContent = prompt.type.toUpperCase();
        document.getElementById('promptText').textContent = prompt.text;

        // Only the selected player can click done
        if (currentPlayer.playerId === currentSelectedPlayer.player_id) {
            doneBtn.style.display = 'block';
        } else {
            doneBtn.style.display = 'none';
        }
    }

    doneBtn.addEventListener('click', async () => {
        // Check if all prompts are used
        const remainingPrompts = allPrompts.filter(p => !p.used);
        
        if (remainingPrompts.length === 0) {
            await supabase
                .from('game_state')
                .update({ game_over: true })
                .eq('room_id', roomCode);
            showGameOver();
        } else {
            // Signal ready for next spin
            await supabase
                .from('game_state')
                .update({ 
                    ready_for_spin: true,
                    current_player: null
                })
                .eq('room_id', roomCode);

            if (isHost) {
                showWheelForHost();
            } else {
                showWaitingForSpin();
            }
        }
    });

    function showGameOver() {
        wheelSection.style.display = 'none';
        selectionScreen.style.display = 'none';
        promptDisplay.style.display = 'none';
        gameOver.style.display = 'block';
    }

    backToLobbyBtn.addEventListener('click', async () => {
        if (!isHost) {
            alert('Only the host can restart the game');
            return;
        }

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

        // Delete game state
        await supabase
            .from('game_state')
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
                    await updateSubmissionCount();
                    
                    // Check if all submitted
                    const { data } = await supabase
                        .from('players')
                        .select('has_submitted')
                        .eq('room_id', roomCode);

                    const allSubmitted = data && data.every(p => p.has_submitted);
                    
                    if (allSubmitted && currentPhase === 'submission') {
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
                    table: 'game_state',
                    filter: `room_id=eq.${roomCode}`
                },
                async (payload) => {
                    const state = payload.new;
                    
                    if (state.current_player && !isHost) {
                        // Player was selected
                        await showSelectionScreen(state.current_player);
                    }

                    if (state.selected_prompt_id) {
                        // Prompt was selected, show it
                        const prompt = allPrompts.find(p => p.id === state.selected_prompt_id);
                        if (prompt) {
                            showPrompt(prompt);
                        }
                    }

                    if (state.ready_for_spin && isHost) {
                        showWheelForHost();
                    }

                    if (state.game_over) {
                        showGameOver();
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
