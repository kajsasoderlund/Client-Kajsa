const allPlayersTBody = document.querySelector("#allPlayers tbody");
const searchPlayer = document.getElementById("searchPlayer");
const btnAdd = document.getElementById("btnAdd");
const closeDialog = document.getElementById("closeDialog");
const jerseyInput = document.getElementById("jersey");
const positionInput = document.getElementById("position");
const playerNameInput = document.getElementById("playerName");
const teamInput = document.getElementById("playerTeam"); 
const errorMessage = document.getElementById("errorMessage"); 
const arrowDown = document.getElementById("arrowDown");
const arrowUp = document.getElementById("arrowUp");


playerNameInput.addEventListener("input", () => {
    if (playerNameInput.value.length > 1) {
        errorMessage.style.display = "none"; 
    } else {
        errorMessage.style.display = "block";
    }
});

let players = []; 
let editingPlayer = null; 

// Fetchplayers from api/players
async function fetchPlayers() {
    try {
        const response = await fetch('http://localhost:3000/api/players');
        if (!response.ok) {
            throw new Error('Failed to fetch players');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching players:', error);
        return []; 
    }
}

// Updating table with the players data
const updateTable = function (players) {
    allPlayersTBody.innerHTML = ""; 
    if (!Array.isArray(players)) {
        console.error('Received invalid players data:', players);
        return;
    }
    players.forEach(player => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <th scope="row">${player.name}</th>
            <td>${player.jersey}</td>
            <td>${player.position}</td>
            <td>${player.team}</td>
            <td>
                <button data-stefansplayerid="${player.id}" class="edit-btn">EDIT</button>
                <button data-stefansplayerid="${player.id}" class="delete-btn">DELETE</button>
            </td>
        `;
        allPlayersTBody.appendChild(tr);
    });
};



// Search function
searchPlayer.addEventListener("input", function () {
    const searchFor = searchPlayer.value.toLowerCase();
    if (players) {
        players.forEach(player => {
            
            player.visible = 
                player.name.toLowerCase().includes(searchFor) ||
                player.position.toLowerCase().includes(searchFor) ||
                (player.team?.toLowerCase() || '').includes(searchFor); // Safely access team and convert to lowercase
        });
        updateTable(players.filter(player => player.visible));
    }
});


// Name can't be empty/minimum 2 characters, position can't be empty, Jersey can't be empty/negative number
function validateName(name) {
    return name.trim().length >= 2;
}
function validateJersey(jersey) {
    return jersey.trim() !== "" && !isNaN(parseInt(jersey));
}
function validatePosition(position) {
    return position.trim() !== "";
}

// showing/hiding error message 
function displayErrorMessage(message) {
    errorMessage.innerText = message;
    errorMessage.style.display = "block";
}
function hideErrorMessage() {
    errorMessage.style.display = "none";
}


// Function to handle add button click  KOLLA DENNA
btnAdd.addEventListener("click", () => {
    playerNameInput.value = ""; // clear fields for after submitting new player
    jerseyInput.value = "";
    positionInput.value = "";
    teamInput.value = "";
    hideErrorMessage(); 
    editingPlayer = null;
    MicroModal.show('modal-1');
});

// Function to handle edit and delete 
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("edit-btn")) {
        const playerId = event.target.dataset.stefansplayerid; 
        const player = players.find(p => p.id == playerId); 
        if (player) {
            playerNameInput.value = player.name;
            jerseyInput.value = player.jersey;
            positionInput.value = player.position;
            editingPlayer = player; 
            MicroModal.show('modal-1'); 
        }
    } else if (event.target.classList.contains("delete-btn")) {
        const playerId = event.target.dataset.stefansplayerid;
        const confirmed = confirm("Are you sure you want to delete this player?");
        if (confirmed) {
            try {
                const response = await fetch(`http://localhost:3000/api/players/${playerId}`, {
                    method: "DELETE"
                });
                if (response.ok) {
                    players = players.filter(player => player.id !== playerId);
                    updateTable(players);
                } else {
                    console.error("Failed to delete player");
                }
            } catch (error) {
                console.error("Error deleting player:", error);
            }
        }
    }
});


//Save button/closeDialog

closeDialog.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const name = playerNameInput.value;
    const jersey = jerseyInput.value;
    const position = positionInput.value;
    const team = teamInput.value; 
    if (!validateName(name)) {
        displayErrorMessage("Name must be at least 2 characters long");
        return;
    }

    if (!validateJersey(jersey)) {
        displayErrorMessage("Jersey number must be a positive integer");
        return;
    }

    if (!validatePosition(position)) {
        displayErrorMessage("Position cannot be empty");
        return;
    }

    const playerData = {
        name,
        jersey,
        position,
        team, 
    };

    try {
        if (editingPlayer) {
            const response = await fetch(`http://localhost:3000/api/players/${editingPlayer.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "PUT",
                body: JSON.stringify(playerData)
            });

            if (response.ok) {
                const updatedPlayer = await response.json();
                const index = players.findIndex(p => p.id === updatedPlayer.id);
                if (index !== -1) {
                    players[index] = updatedPlayer;
                    updateTable(players);
                    MicroModal.close('modal-1');
                }
            } else {
                console.error("Failed to update player");
            }
        } else {
            const response = await fetch("http://localhost:3000/api/players", {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify(playerData)
            });

            if (response.ok) {
                const json = await response.json();
                players.push(json);
                updateTable(players);
                MicroModal.close('modal-1');
            } else {
                console.error("Failed to create player");
            }
        }
    } catch (error) {
        console.error("Error saving player:", error);
    }
});

fetchPlayers()
    .then(playersData => {
        players = playersData;
        updateTable(players);
    })
    .catch(error => console.error('Error fetching and updating players:', error));



 // ---- sorting
async function fetchPlayersWithSorting(sortCol, sortOrder) {
    try {
        const response = await fetch(`http://localhost:3000/api/players?sortCol=${sortCol}&sortOrder=${sortOrder}`);
        if (!response.ok) {
            throw new Error('Failed to fetch players');
        }
        const data = await response.json();
        return data; 
    } catch (error) {
        return []; 
    }
}
    // arrow functions for sorting
    arrowDown.addEventListener("click", async () => {
        const players = await fetchPlayersWithSorting('name', 'ASC');
        updateTable(players);
    });
    
    arrowUp.addEventListener("click", async () => {
        const players = await fetchPlayersWithSorting('name', 'DESC');
        updateTable(players);
    });
    