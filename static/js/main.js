let client;
const container = document.getElementById('container');
const speedAdjust = 0.75; // Adjust the speed of the bouncing images as needed
const padding = 50; // Padding from the edges and between elements
const velocities = [];
const dynamaxState = []; // Tracks which Pokémon are Dynamaxxed

function toProperCase(str) {
    if (!str) return ''; // Handle empty or null input
    
    // Capitalize the first letter and concatenate the rest of the string
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeAllWords(str) {
    if (!str) return '';
    
    return str.toLowerCase().split(' ').map(word => {
        // Use the previous function on each word
        return toProperCase(word);
    }).join(' ');
}

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to store URL parameters in local storage
function storeUrlParameters() {
    const params = ['client_id', 'redirect_uri', 'username', 'moderator_username'];
    params.forEach(param => {
        const value = getUrlParameter(param);
        if (value) {
            localStorage.setItem(param, value);
        }
    });
}

// Function to retrieve URL parameters from local storage
function retrieveUrlParameters() {
    const params = ['client_id', 'redirect_uri', 'username', 'moderator_username'];
    const result = {};
    params.forEach(param => {
        const value = localStorage.getItem(param);
        if (value) {
            result[param] = value;
        }
    });
    return result;
}

// Function to store access token in local storage
function storeAccessToken(token) {
    localStorage.setItem('access_token', token);
}

// Function to retrieve access token from local storage
function retrieveAccessToken() {
    return localStorage.getItem('access_token');
}

const urlParams = retrieveUrlParameters();
const clientId = urlParams.client_id || getUrlParameter('client_id');
//const redirectUri = urlParams.redirect_uri || getUrlParameter('redirect_uri') || 'http://127.0.0.1:5000';
//const redirectUri = urlParams.redirect_uri || getUrlParameter('redirect_uri') || 'https://itsmejoji.github.io/StreamAssets/parasocial-checker.html';
const redirectUri = urlParams.redirect_uri || getUrlParameter('redirect_uri') || 'http://localhost:5000/'; //For Development
const username = urlParams.username || getUrlParameter('username');
const moderatorUsername = urlParams.moderator_username || getUrlParameter('moderator_username') || username;
const youtubeAPI = urlParams.youtube_api || getUrlParameter('youtube_api');
const youtubeStreamId = urlParams.youtube_stream_id || getUrlParameter('youtube_stream_id');

// Function to check if an image exists
function imageExists(url, callback) {
    const img = new Image();
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
    img.src = url;
}

function getRandomPokemon() {
    const randomIndex = Math.floor(Math.random() * availablePokemon.length);
    return availablePokemon[randomIndex];
}

// Function to create and append Pokémon images and usernames

function addNewPokemonAndUsernames(chatter, previousIndex) {
    let index = previousIndex;

    const specialUsers = {
        'itsmejoji': 'blastoise-s',
        'nightbot': 'porygon-s',
        'thomkeeris': 'sableye',
        'sirtoastyt': 'scizor-s',
        'cherrius_': 'deoxys',
        'welcome2therage': 'zygarde-complete-s',
        'sd_z_yt2': 'gengar-mega-s',
        'katfreak101': 'liepard-s'
    }
    console.log('Adding new Pokémon for ' + chatter.user_name);

    function addPokemon() {
        // Use storedPokemon if provided, otherwise get a random one
        let imageName = chatter.storedPokemon || getRandomPokemon();
        if (specialUsers[chatter.user_name]) {
            imageName = specialUsers[chatter.user_name]; // Use special Pokémon for certain users
        }

        const imgElement = document.createElement('img');
        imgElement.className = 'bouncingImage';
        imgElement.id = `pokemon${index + 1}`;
        imgElement.alt = `Pokemon ${index + 1}`;

        const usernameElement = document.createElement('div');
        usernameElement.className = 'username';
        usernameElement.id = `username${index + 1}`;
        usernameElement.textContent = chatter.user_name;

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.id = `message${index + 1}`;

        const emoteElement = document.createElement('img');
        emoteElement.className = 'emote';
        emoteElement.id = `emote${index + 1}`;
        emoteElement.style.display = 'none'

        container.appendChild(imgElement);
        container.appendChild(usernameElement);
        container.appendChild(messageElement);
        messageElement.appendChild(emoteElement);

        // Shiny Check
        const MAX_RANGE = 10;
        function getRandomNumber(max) {
            return Math.floor(Math.random() * max) + 1;
        }
        const randomNumber1 = getRandomNumber(MAX_RANGE);
        const randomNumber2 = getRandomNumber(MAX_RANGE);
        if (!imageName.includes("-s")){
            if (randomNumber1 === randomNumber2) {
                imageName = imageName + '-s';
            }
        }

        function imageExists(imagePath, modifier) {
            if (imagePath) {
                return imagePath;
            } else {
                return 'assets/images/Pokemon/' + imageName.replace(modifier, '') + '.png';
            }
        }

        let imagePath = 'assets/images/Pokemon/' + imageName + '.png';
        if (imageName.endsWith('-f-s')) {
            const modifier = '-f-s';
            imagePath = 'assets/images/Pokemon/shiny/female/' + imageName.slice(0, -4) + '.png';
            imagePath = imageExists(imagePath, modifier);
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        } else if (imageName.endsWith('-f')) {
            const modifier = '-f';
            imagePath = 'assets/images/Pokemon/female/' + imageName.slice(0, -2) + '.png';
            imagePath = imageExists(imagePath, modifier);
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        } else if (imageName.endsWith('-s')) {
            const modifier = '-s';
            imagePath = 'assets/images/Pokemon/shiny/' + imageName.slice(0, -2) + '.png';
            imagePath = imageExists(imagePath, modifier);
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        } else {
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        }

        // Save the Pokemon data
        saveUserPokemonData(chatter.user_name, {
            pokemon: imageName,
            lastSeen: new Date().toISOString()
        }).catch(error => {
            console.error('Error saving Pokemon data:', error);
        });

        // Initialize positions at the top left corner
        const posX = padding;
        const posY = padding;

        imgElement.style.left = `${posX}px`;
        imgElement.style.top = `${posY}px`;
        usernameElement.style.left = `${posX}px`;
        usernameElement.style.top = `${posY + imgElement.height}px`;
        messageElement.style.left = `${posX}px`;
        messageElement.style.top = `${posY + imgElement.height}px`;
        emoteElement.style.left = `${posX}px`;
        emoteElement.style.top = `${posY + imgElement.height}px`;

        
        velocities.push({
            x: (Math.random() * 2 - 1) * speedAdjust,
            y: (Math.random() * 2 - 1) * speedAdjust
        });
        if (chatter.user_name === 'itsmejoji') 
        {
            updatePosition();
        }
    }

    addPokemon();

    console.log('New Pokémon added for ' + chatter.user_name);
}


isUpdating = false;

function updatePosition() {

    if (isUpdating) return;
    isUpdating = true;

    const images = document.querySelectorAll('.bouncingImage');
    const usernames = document.querySelectorAll('.username');
    const messages = document.querySelectorAll('.message');
    // const emotes = document.querySelectorAll('.emote')

    images.forEach((img, index) => {
        if (img.style.display === 'none') return;

        let posX = parseFloat(img.style.left) || 0;
        let posY = parseFloat(img.style.top) || 0;

        posX += velocities[index].x;
        posY += velocities[index].y;

        if (posX + img.width >= container.clientWidth || posX <= 0) {
            velocities[index].x = -velocities[index].x;
        }
        if (posY + img.height >= container.clientHeight || posY <= 0) {
            velocities[index].y = -velocities[index].y;
        }

        images.forEach((otherImg, otherIndex) => {
            if (index !== otherIndex && otherImg.style.display !== 'none') {
                const otherPosX = parseFloat(otherImg.style.left) || 0;
                const otherPosY = parseFloat(otherImg.style.top) || 0;

                // Define smaller collision area (20x20px) centered within each image
                const collisionSize = 50;
                const halfCollisionSize = collisionSize / 2;

                const imgCenterX = posX + img.width / 2;
                const imgCenterY = posY + img.height / 2;
                const otherImgCenterX = otherPosX + otherImg.width / 2;
                const otherImgCenterY = otherPosY + otherImg.height / 2;

                if (Math.abs(imgCenterX - otherImgCenterX) < collisionSize &&
                    Math.abs(imgCenterY - otherImgCenterY) < collisionSize) {
                    velocities[index].x = -velocities[index].x;
                    velocities[index].y = -velocities[index].y;
                    velocities[otherIndex].x = -velocities[otherIndex].x;
                    velocities[otherIndex].y = -velocities[otherIndex].y;
                }
            }
        });

        const {scaleX, scaleY} = getScale(img);
        if (velocities[index].x > 0) {
            img.style.transform = `scale(${-Math.abs(scaleX)}, ${scaleY})`;
        } else {
            img.style.transform = `scale(${Math.abs(scaleX)}, ${scaleY})`;
        }

        img.style.left = posX + 'px';
        img.style.top = posY + 'px';
        usernames[index].style.left = `${posX - 20}px`;
        messages[index].style.left = `${posX - 20}px`;

        if (dynamaxState[index]) {
            usernames[index].style.top = `${posY + img.height * 2}px`;
            messages[index].style.top = `${posY + 5}px`;
        }
        else {
            usernames[index].style.top = `${posY + img.height}px`;
            messages[index].style.top = `${posY + 5}px`;
        }
        // emotes[index].style.left = `${posX}px`;
        // emotes[index].style.top = `${posY + 50}px`;
    });

    isUpdating = false;
    requestAnimationFrame(updatePosition);
}

function cropTransparent(imgElement) {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed if image is from another domain
    img.src = imgElement.src;

    img.onload = function () {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        let top = img.height, bottom = 0, left = img.width, right = 0;

        // Find bounding box of non-transparent pixels
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const alpha = pixels[index + 3]; // Alpha channel

                if (alpha > 0) { // If not fully transparent
                    if (x < left) left = x;
                    if (x > right) right = x;
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
        }

        // New cropped dimensions
        const newWidth = right - left + 1;
        const newHeight = bottom - top + 1;

        if (newWidth > 0 && newHeight > 0) {
            // Create a new canvas for cropped image
            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = newWidth;
            croppedCanvas.height = newHeight;
            const croppedCtx = croppedCanvas.getContext("2d");

            croppedCtx.drawImage(canvas, left, top, newWidth, newHeight, 0, 0, newWidth, newHeight);

            // Replace original image with cropped one
            imgElement.src = croppedCanvas.toDataURL();
        }
    };
}

function getScale(img){
    const transform = window.getComputedStyle(img).transform;

    if (transform === 'none') {
        return {scaleX: 1, scaleY: 1}; // Default scale if no transform is applied
    }

    const matrix = new DOMMatrix(transform);
    return {scaleX: matrix.a, scaleY: matrix.d};
}

function authenticate() {
    storeUrlParameters();
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=chat:read+chat:edit+moderator:read:chatters+channel:read:redemptions`;
    window.location.href = authUrl;
}

function getAccessTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
}

async function fetchChannelId(username, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
        return data.data[0].id;
    } else {
        throw new Error('Channel not found');
    }
}

async function fetchModeratorId(moderatorUsername, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${moderatorUsername}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
        return data.data[0].id;
    } else {
        throw new Error('Moderator not found');
    }
}

async function fetchChatUsers(channelId, moderatorId, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${channelId}&moderator_id=${moderatorId}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching chat users:', response.status, errorData);
        throw new Error(`Error fetching chat users: ${response.status}`);
    }

    const data = await response.json();

}

function connectToEventSub(accessToken, broadcasterId) {
    const socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=60');

    socket.onopen = () => {
        console.log('Connected to EventSub');
    };

    socket.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('EventSub message:', message);

        // On welcome, register the subscription
        if (message.metadata && message.metadata.message_type === 'session_welcome') {
            const sessionId = message.payload.session.id;
            // Register the subscription using the REST API
            await createChannelPointsRedemptionSubscription(accessToken, broadcasterId, sessionId);
        }

        // Handle incoming events
        if (message.metadata && message.metadata.message_type === 'notification') {
            const redemptionData = message.payload.event;
            handleChannelPointRedemption({ data: { redemption: redemptionData } });
        }
    };

    socket.onerror = (error) => {
        console.error('EventSub error:', error);
    };

    socket.onclose = () => {
        console.warn('EventSub connection closed. Reconnecting in 100 seconds...');
        setTimeout(() => connectToEventSub(accessToken, broadcasterId), 100000);
    };
}

// Helper to create the EventSub subscription via REST API
async function createChannelPointsRedemptionSubscription(accessToken, broadcasterId, sessionId) {
    const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'channel.channel_points_custom_reward_redemption.add',
            version: '1',
            condition: {
                broadcaster_user_id: broadcasterId
            },
            transport: {
                method: 'websocket',
                session_id: sessionId
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create EventSub subscription:', errorData);
    } else {
        console.log('EventSub subscription created');
    }
}

function handleChannelPointRedemption(data) {
    console.log("Redemption data:", data.data);
    const redemption = data.data.redemption;
    const channelName = `#${username}`;

    if (redemption.reward.title === 'Pokemon Overlay Reroll') {
        const username = redemption.user_login;

        const index = existingUsernames.findIndex((name) => name === username);

        if (index !== -1) {
            const newPokemon = getRandomPokemon();
            const pokemonElement = document.getElementById(`pokemon${index + 1}`);
            if (pokemonElement) {
                pokemonElement.src = `assets/images/Pokemon/${newPokemon}.png`;
                // set dataset before cropping which may change src to data: URL
                pokemonElement.dataset.pokemon = newPokemon;
                cropTransparent(pokemonElement);

                // Save to server/local
                saveUserPokemonData(username, { pokemon: newPokemon, lastSeen: new Date().toISOString() })
                    .catch(err => console.error('Save failed:', err));

                const msg = `${username} rerolled their Pokémon to ${newPokemon.replace('-',' ')}`;
                console.log(msg);
                if (typeof client !== "undefined") {
                    client.say(channelName, capitalizeAllWords(msg)); // Sends message to the channel
                }
            }
        } else {
            console.warn(`User ${username} is not currently in the chat.`);
        }
    }

    else if (redemption.reward.title === 'Shiny Pokemon Overlay Reroll'){
        const username = redemption.user_login;

        const index = existingUsernames.findIndex((name) => name === username);

        if (index !== -1){
            const newPokemon = getRandomPokemon();
            const pokemonElement = document.getElementById(`pokemon${index + 1}`);
            let shiny = '';

            const MAX_RANGE = 3;
            function getRandomNumber(max) {
                return Math.floor(Math.random() * max) + 1;
            }
            const randomNumber1 = getRandomNumber(MAX_RANGE);
            const randomNumber2 = getRandomNumber(MAX_RANGE);
            if (pokemonElement) {
                if (randomNumber1 === randomNumber2) {
                    pokemonElement.src = `assets/images/Pokemon/shiny/${newPokemon}.png`;
                    shiny = 'Shiny';
                } else{
                    pokemonElement.src = `assets/images/Pokemon/${newPokemon}.png`;
                }

                // set dataset and save
                pokemonElement.dataset.pokemon = (shiny ? 'shiny-' : '') + newPokemon;
                cropTransparent(pokemonElement);

                saveUserPokemonData(username, { pokemon: pokemonElement.dataset.pokemon, lastSeen: new Date().toISOString() })
                    .catch(err => console.error('Save failed:', err));

                const msg = `${username} rerolled their Pokémon to ${shiny} ${newPokemon.replace('-',' ')}`;
                console.log(msg);
                if (typeof client !== "undefined") {
                    client.say(channelName, capitalizeAllWords(msg)); // Sends message to the channel
                }
            }
        } else {
            console.warn(`User ${username} is not currently in the chat.`);
        }
    }

    else if (redemption.reward.title === 'Dynamax!')
        {
        const username = redemption.user_login;

        const index = existingUsernames.findIndex((name) => name === username);

        if (index !== -1) {
            const pokemonElement = document.getElementById(`pokemon${index + 1}`);
            const usernameElement = document.getElementById(`username${index + 1}`);
            const messageElement = document.getElementById(`message${index + 1}`);

            if (pokemonElement && usernameElement && messageElement) {

                const { scaleX, scaleY } = getScale(pokemonElement);

                // Dynamax the Pokémon by doubling its current scale
                const newScaleX = scaleX * 3;
                const newScaleY = scaleY * 3;

                pokemonElement.style.transform = `scale(${newScaleX}, ${newScaleY})`;
            
                // Adjust the positions of the username and message
                const originalUsernameTop = parseFloat(usernameElement.style.top) || 0;
                const originalMessageTop = parseFloat(messageElement.style.top) || 0;

                const newUsernameTop = originalUsernameTop + pokemonElement.offsetHeight;
                const newMessageTop = parseFloat(pokemonElement.style.top) - messageElement.offsetHeight;

                usernameElement.style.top = `${newUsernameTop}px`;
                messageElement.style.top = `${newMessageTop}px`;

                dynamaxState[index] = true; // Mark this Pokémon as Dynamaxxed

                const msg = `${username} Dynamaxxed their Pokémon!`;
                console.log(msg);
                if (typeof client !== "undefined") {
                    client.say(channelName, msg); // Sends message to the channel
                }

            setTimeout(() => {
                pokemonElement.style.transform = `scale(${scaleX}, ${scaleY})`; // Reset scale to original
                usernameElement.style.top = `${originalUsernameTop}px`; // Reset username position
                messageElement.style.top = `${originalMessageTop}px`; // Reset message position

                dynamaxState[index] = false; // Reset Dynamax state
                    
                    console.log(`${username}'s Pokémon has returned to its normal size.`);
                    if (typeof client !== "undefined") {
                        client.say(channelName, `${username}'s Pokémon has returned to its normal size.`);
                    }
                }, 15000); // 60 seconds                
            }
        } else {
            console.warn(`User ${username} is not currently in the chat.`);
        }
        }

    else if (redemption.reward.title === 'Choose Your Pokemon on the Overlay!'){
        const username = redemption.user_login;
        const userInput = redemption.user_input;

        const index = existingUsernames.findIndex((name) => name === username);

            if (index !== -1){
                const newPokemon = userInput
                const pokemonElement = document.getElementById(`pokemon${index + 1}`);

                const MAX_RANGE = 3;
                function getRandomNumber(max) {
                    return Math.floor(Math.random() * max) + 1;
                }
                const randomNumber1 = getRandomNumber(MAX_RANGE);
                const randomNumber2 = getRandomNumber(MAX_RANGE);
                if (pokemonElement) {
                    if (newPokemon.endsWith('-s')){
                        pokemonElement.src = `assets/images/Pokemon/shiny/${newPokemon.replace('-s','')}.png`;
                        pokemonElement.dataset.pokemon = newPokemon;
                    } else{
                        pokemonElement.src = `assets/images/Pokemon/${newPokemon}.png`;
                        pokemonElement.dataset.pokemon = newPokemon;
                    }

                    cropTransparent(pokemonElement);

                    // Save the new Pokemon data
                    saveUserPokemonData(username, {
                        pokemon: pokemonElement.dataset.pokemon,
                        lastSeen: new Date().toISOString()
                    }).catch(err => console.error('Save failed:', err));

                    const msg = `${username} rerolled their Pokémon to ${newPokemon}`;
                    console.log(msg);
                    if (typeof client !== "undefined") {
                        client.say(channelName, msg); // Sends message to the channel
                    }
                }
            } else {
                console.warn(`User ${username} is not currently in the chat.`);
            }
    }
    else {
        console.warn(`Unhandled redemption: ${redemption.reward.title}`);
    }
}


function formatMessage(tags, message){
    if (!tags.emotes) {
        console.log("regular message detected")
        return [{ type: "text", content: message }];
    }

    let parts = [];
    let lastIndex = 0;

    let emoteList = [];
    Object.keys(tags.emotes).forEach(emoteId => {
        tags.emotes[emoteId].forEach(index => {
            let [start, end] = index.split('-').map(Number);
            emoteList.push({id: emoteId, start, end});
        });
    });

    emoteList.sort((a,b) => a.start - b.start);

    emoteList.forEach(({id, start, end}) => {
        if (lastIndex < start){
            parts.push({type: "text", content: message.substring(lastIndex, start)});
            console.log("regular message detected")
        }
        parts.push({type: "emote", content: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`});
        lastIndex = end + 1;
        console.log("emote detected")
    });

    if (lastIndex < message.length){
        parts.push({type: "text", content: message.substring(lastIndex)});
        console.log("regular message detected")
    }

    return parts;
}


// Function to save user Pokemon data
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
        return true;
    } catch (error) {
        console.error('Failed to save Pokemon data:', error);
        // Fallback to localStorage if server fails
        const storedData = JSON.parse(localStorage.getItem('userPokemonData') || '{}');
        storedData[username] = pokemonData;
        localStorage.setItem('userPokemonData', JSON.stringify(storedData));
        return false;
    }
}

// Function to load user Pokemon data
async function loadUserPokemonData(username) {
    try {
        const response = await fetch(`/api/pokemon/${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to load Pokemon data:', error);
        // Fallback to localStorage if server fails
        const storedData = JSON.parse(localStorage.getItem('userPokemonData') || '{}');
        return storedData[username];
    }
}

// Function to load all stored users and their Pokemon
async function loadAllStoredUserData() {
    try {
        const response = await fetch('/api/pokemon');
        if (!response.ok) throw new Error('Failed to load');
        return await response.json();
    } catch (error) {
        console.error('Failed to load all Pokemon data:', error);
        // Fallback to localStorage if server fails
        return JSON.parse(localStorage.getItem('userPokemonData') || '{}');
    }
}

const existingUsernames = [];
const accessToken = getAccessTokenFromUrl() || retrieveAccessToken();
if (accessToken) {
    storeAccessToken(accessToken);
    Promise.all([fetchChannelId(username, accessToken), fetchModeratorId(moderatorUsername, accessToken)])
        .then(([channelId, moderatorId]) => {
            connectToEventSub(accessToken, channelId);
            fetchChatUsers(channelId, moderatorId, accessToken);

            const chatters = [];

            client = new tmi.Client({
                options: { debug: true },
                identity: {
                    username: username,
                    password: `oauth:${accessToken}`
                },
                channels: [username]
            });

            client.connect();

            // Listen to messages
            client.on('message', (channel, tags, message, self) => {

                // if (self) return; // Ignore messages from the bot

                const parts = formatMessage(tags, message);
                const badges = tags.badges || {};
                const isBroadcaster = badges.broadcaster === '1';
                const isModerator = badges.moderator === '1';
                const isSubscriber = tags.subscriber === '1';
                const isVip = badges.vip === '1';

                // Ensure the user is in the chatters array
                if (!chatters.some(chatter => chatter.user_name === tags.username)) {
                    chatters.push({ user_name: tags.username });
                }

                const username = tags.username;
                if (!existingUsernames.includes(username)) {
                    existingUsernames.push(username);
                    // Check if user has stored Pokemon data
                    loadUserPokemonData(username).then(storedData => {
                        if (storedData && storedData.pokemon) {
                            console.log(`Loading stored Pokemon for ${username}: ${storedData.pokemon}`);
                            // Add the user with their stored Pokemon
                            addNewPokemonAndUsernames({ 
                                user_name: username,
                                storedPokemon: storedData.pokemon 
                            }, chatters.length - 1);
                        } else {
                            // Add new user with random Pokemon
                            addNewPokemonAndUsernames({ user_name: username }, chatters.length - 1);
                        }
                        console.log('New User Added:' + username);
                    }).catch(error => {
                        console.error('Error loading stored Pokemon:', error);
                        // Fallback to random Pokemon on error
                        addNewPokemonAndUsernames({ user_name: username }, chatters.length - 1);
                    });
                }

                // Listen for a specific command from "ItsMeJoji"
                
                // Spawn Test Pokemon
                if (username === 'itsmejoji' && message.trim() === '!spawn') {
                    console.log('Spawn command received from ItsMeJoji');
                    spawnRandomPokemon();
                }                    
                // Reset Overlay
                if (username === 'itsmejoji' && message.trim() === '!reset') {
                    console.log('Reset command received from ItsMeJoji');
                    resetPokemonAndUsers();
                }
                // Reset Specific User
                if (username === 'itsmejoji' && message.startsWith('!reset-')) {
                    const targetUsername = message.split('!reset-')[1].trim(); // Extract the target username
                    if (targetUsername) {
                        resetSpecificUser(targetUsername);
                    } else {
                        console.log('Invalid reset command. No username specified.');
                    }
                }
                // Check Specific User's Pokemon
                if (message.trim() === '!check') {
                    console.log('Check command received from ' + username);
                    checkUserPokemon(username);
                }

                console.log('Badges:', badges);
                if (isBroadcaster || isModerator || isSubscriber || isVip) {

                    console.log('User is a mod, sub, or VIP');

                    //TODO: Add logic to handle mod, sub, and VIP messages
                    
                    // Display the message above the corresponding Pokémon
                    const usernameIndex = chatters.findIndex(chatter => chatter.user_name === tags.username);
                    if (usernameIndex !== -1) {
                        // Try to display the message, but avoid creating full user elements here.
                        // Use a small retry loop because element creation can race with message events.
                        const tryDisplay = (attemptsLeft) => {
                            const messageElement = document.getElementById(`message${usernameIndex + 1}`);
                            const emoteElement = document.getElementById(`emote${usernameIndex + 1}`);

                            if (messageElement) {
                                messageElement.textContent = message;
                                // Optionally handle emote display here if parts were parsed

                                setTimeout(() => {
                                    messageElement.textContent = '';
                                }, 5000);
                                return;
                            }

                            if (attemptsLeft > 0) {
                                // wait a short time for the elements to be created elsewhere
                                setTimeout(() => tryDisplay(attemptsLeft - 1), 100);
                            } else {
                                // Give up — element never appeared. Do not create elements here to avoid duplicates.
                                console.warn(`Message element for ${tags.username} not found after retries.`);
                            }
                        };

                        tryDisplay(8); // try for ~800ms total
                    }
                }

            });

let testUserCounter = 1; // Initialize a counter for test usernames            

// Functions for Commands


function spawnRandomPokemon() {
    const username = `Test_${String(testUserCounter).padStart(2, '0')}`; // Generate username like Test_01, Test_02, etc.
    testUserCounter++; // Increment the counter for the next spawn

    // Add the new Pokémon and username
    addNewPokemonAndUsernames({ user_name: username }, chatters.length);

    console.log('Spawning random Pokémon for:', username);
}

function resetPokemonAndUsers() {
    console.log('Resetting Pokémon and users...');

    // Clear existing Pokémon and usernames from the overlay
    chatters.forEach((_, index) => {
        const pokemonElement = document.getElementById(`pokemon${index + 1}`);
        const usernameElement = document.getElementById(`username${index + 1}`);
        const messageElement = document.getElementById(`message${index + 1}`);
        const emoteElement = document.getElementById(`emote${index + 1}`);

        if (pokemonElement) pokemonElement.remove();
        if (usernameElement) usernameElement.remove();
        if (messageElement) messageElement.remove();
        if (emoteElement) emoteElement.remove();
    });

    let index = 0;

    function spawnNext() {
        if (index < chatters.length) {
            const chatter = chatters[index];
            addNewPokemonAndUsernames(chatter, index);
            console.log(`Spawned Pokémon for user: ${chatter.user_name}`);
            index++;
            setTimeout(spawnNext, 1000); // Wait 1 second before spawning the next Pokémon
        } else {
            console.log('All Pokémon and users have been reset.');
        }
    }

    spawnNext(); // Start the spawning process
}

//Never reset yourself unless you want lightspeed
function resetSpecificUser(targetUsername) {
    console.log(`Resetting Pokémon and overlay for user: ${targetUsername}`);

    // Find the index of the target user in the chatters array
    const userIndex = chatters.findIndex(chatter => chatter.user_name === targetUsername);

    if (userIndex === -1) {
        console.log(`User ${targetUsername} not found.`);
        return;
    }

    // Remove existing Pokémon and overlay elements for the target user
    const pokemonElement = document.getElementById(`pokemon${userIndex + 1}`);
    const usernameElement = document.getElementById(`username${userIndex + 1}`);
    const messageElement = document.getElementById(`message${userIndex + 1}`);
    const emoteElement = document.getElementById(`emote${userIndex + 1}`);

    if (pokemonElement) pokemonElement.remove();
    if (usernameElement) usernameElement.remove();
    if (messageElement) messageElement.remove();
    if (emoteElement) emoteElement.remove();

    // Respawn the Pokémon and overlay for the target user
    addNewPokemonAndUsernames(chatters[userIndex], userIndex);
    console.log(`Respawned Pokémon for user: ${targetUsername}`);
}

async function checkUserPokemon(targetUsername) {
    console.log(`Checking Pokémon for user: ${targetUsername}`);

    // Find the index of the target user in the chatters array
    const userIndex = chatters.findIndex(chatter => chatter.user_name === targetUsername);

    if (userIndex === -1) {
        console.log(`User ${targetUsername} not found.`);
        return;
    }

    const pokemonElement = document.getElementById(`pokemon${userIndex + 1}`);
    let reportedPokemon = null;

    if (pokemonElement && pokemonElement.dataset && pokemonElement.dataset.pokemon) {
        reportedPokemon = pokemonElement.dataset.pokemon;
    }

    // If we don't have it on the element, try server/local storage
    if (!reportedPokemon) {
        try {
            const stored = await loadUserPokemonData(targetUsername);
            if (stored && stored.pokemon) reportedPokemon = stored.pokemon;
        } catch (e) {
            console.error('Error loading stored data for check:', e);
        }
    }

    // Fallback to parsing the src (last resort)
    if (!reportedPokemon && pokemonElement) {
        try {
            reportedPokemon = pokemonElement.src.split('/Pokemon/').pop().replace('.png', '').replace('/', ' ');
        } catch (e) {
            reportedPokemon = pokemonElement.src;
        }
    }

    if (reportedPokemon) {
        // Normalize shiny markers: '-s' suffix or 'shiny-' prefix
        let isShiny = false;
        let name = reportedPokemon;

        if (typeof name === 'string') {
            if (name.endsWith('-s')) {
                isShiny = true;
                name = name.slice(0, -2);
            }
            if (name.startsWith('shiny-')) {
                isShiny = true;
                name = name.slice(6);
            }
            // Also handle names saved as 'shinyPikachu' or similar unlikely forms by checking 'shiny' prefix
            if (!isShiny && name.toLowerCase().startsWith('shiny')) {
                // remove leading 'shiny' and any non-letter separators
                isShiny = true;
                name = name.replace(/^shiny[-_\s]*/i, '');
            }
        }

        const displayName = `${isShiny ? 'Shiny ' : ''}${capitalizeAllWords(String(name).replace(/-/g, ' ').replace(/_/g, ' '))}`;

        console.log(`${targetUsername} is ${displayName}`);
        if (typeof client !== "undefined") {
            client.say(`#${username}`, `${capitalizeAllWords(targetUsername)} has ${displayName}`);
        }
    } else {
        console.log(`No Pokémon found for user ${targetUsername}.`);
        if (typeof client !== "undefined") {
            client.say(`#${username}`, `No Pokémon found for user ${targetUsername}.`);
        }
    }
}



            // Listen to users joining the channel
            // client.on('join', (channel, username, self) => {
            //     if (!chatters.some(chatter => chatter.user_name === username)) {
            //         //chatters.push({ user_name: username });
            //         // if (!existingUsernames.includes(username)) {
            //         //     existingUsernames.push(username);
            //         //     addNewPokemonAndUsernames({ user_name: username }, chatters.length - 1);
            //         // }
            //     }
            // });

            // Listen to users leaving the channel
            // client.on('part', (channel, username, self) => {
            //     const index = chatters.findIndex(chatter => chatter.user_name === username);
            //     if (index !== -1) {
            //         chatters.splice(index, 1); // Remove the user from chatters array
            //     }
            // });

            // Listen to deleted messages
            client.on('ban', (channel, username, deletedMessage, userstate) => {
                // Find the index of the deleted user's Pokémon
                const index = chatters.findIndex(chatter => chatter.user_name === username);

                if (index !== -1) {
                    // Remove Pokémon, username, and message elements from the DOM
                    const pokemonElement = document.getElementById(`pokemon${index + 1}`);
                    const usernameElement = document.getElementById(`username${index + 1}`);
                    const messageElement = document.getElementById(`message${index + 1}`);

                    if (pokemonElement) pokemonElement.remove();
                    if (usernameElement) usernameElement.remove();
                    if (messageElement) messageElement.remove();

                    // Remove user from chatters and existingUsernames arrays
                    chatters.splice(index, 1);
                    existingUsernames.splice(existingUsernames.indexOf(username), 1);
                }
            });

            // Listen for Bans
            client.on('ban', (channel, username, reason, userstate) => {
                // Find the index of the deleted user's Pokémon
                const index = chatters.findIndex(chatter => chatter.user_name === username);

                if (index !== -1) {
                    // Remove Pokémon, username, and message elements from the DOM
                    const pokemonElement = document.getElementById(`pokemon${index + 1}`);
                    const usernameElement = document.getElementById(`username${index + 1}`);
                    const messageElement = document.getElementById(`message${index + 1}`);

                    if (pokemonElement) pokemonElement.remove();
                    if (usernameElement) usernameElement.remove();
                    if (messageElement) messageElement.remove();

                    // Remove user from chatters and existingUsernames arrays
                    chatters.splice(index, 1);
                    existingUsernames.splice(existingUsernames.indexOf(username), 1);
                }
            });

            // Listen for Timeouts
            client.on('timeout', (channel, username, duration, reason, userstate) => {
                // Find the index of the deleted user's Pokémon
                const index = chatters.findIndex(chatter => chatter.user_name === username);

                if (index !== -1) {
                    // Remove Pokémon, username, and message elements from the DOM
                    const pokemonElement = document.getElementById(`pokemon${index + 1}`);
                    const usernameElement = document.getElementById(`username${index + 1}`);
                    const messageElement = document.getElementById(`message${index + 1}`);

                    if (pokemonElement) pokemonElement.remove();
                    if (usernameElement) usernameElement.remove();
                    if (messageElement) messageElement.remove();

                    // Remove user from chatters and existingUsernames arrays
                    chatters.splice(index, 1);
                    existingUsernames.splice(existingUsernames.indexOf(username), 1);
                }
            });


        })
        .catch(error => console.error(error));
} else {
    authenticate();
}


