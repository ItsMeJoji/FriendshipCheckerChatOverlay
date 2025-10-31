// WebSocket connection handling
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('status', (data) => {
    console.log('Server status:', data.message);
});

socket.on('chat_message', (data) => {
    const { username, message, badges } = data;
    // Update the message display for the user's Pokemon
    const index = existingUsernames.findIndex(name => name === username);
    if (index !== -1) {
        const messageElement = document.getElementById(`message${index + 1}`);
        if (messageElement) {
            messageElement.textContent = message;
            setTimeout(() => {
                messageElement.textContent = '';
            }, 5000);
        }
    }
});

socket.on('pokemon_updated', (data) => {
    const { username, pokemon } = data;
    const index = existingUsernames.findIndex(name => name === username);
    if (index !== -1) {
        const pokemonElement = document.getElementById(`pokemon${index + 1}`);
        if (pokemonElement) {
            // Update the Pokemon image
            pokemonElement.src = `assets/images/Pokemon/${pokemon}.png`;
            pokemonElement.dataset.pokemon = pokemon;
            cropTransparent(pokemonElement);
        }
    }
});

socket.on('reset_pokemon', (data) => {
    const { username, pokemon } = data;
    const index = existingUsernames.findIndex(name => name === username);
    if (index !== -1) {
        resetSpecificUser(username);
    }
});

// Update the existing functions to use WebSocket
async function getRandomPokemon() {
    try {
        const response = await fetch('/api/pokemon/random');
        const data = await response.json();
        return data.pokemon;
    } catch (error) {
        console.error('Error getting random Pokemon:', error);
        return 'pikachu'; // Fallback
    }
}

// Modify saveUserPokemonData to emit socket event
async function saveUserPokemonData(username, pokemonData) {
    try {
        const response = await fetch(`/api/pokemon/${encodeURIComponent(username)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pokemonData)
        });
        if (!response.ok) throw new Error('Failed to save');
        
        // Emit the update via WebSocket
        socket.emit('pokemon_update', {
            username,
            pokemon: pokemonData.pokemon
        });
        
        return true;
    } catch (error) {
        console.error('Failed to save Pokemon data:', error);
        // Fallback to localStorage
        const storedData = JSON.parse(localStorage.getItem('userPokemonData') || '{}');
        storedData[username] = pokemonData;
        localStorage.setItem('userPokemonData', JSON.stringify(storedData));
        return false;
    }
}