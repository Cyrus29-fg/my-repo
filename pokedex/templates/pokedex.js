const maximumPokemon = 1025;
const pokemonCache = new Map();
const statMaximum = 180;
let pokemonCards = [];

window.addEventListener("DOMContentLoaded", loadPokemon);

async function loadPokemon() {
    const results = document.getElementById("pokemon-results");
    const search = document.getElementById("pokemon-search");
    const status = document.getElementById("search-status");
    const description = document.getElementById("pokemon-description");

    search.addEventListener("input", filterPokemon);
    status.textContent = "Loading Pokémon list...";

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${maximumPokemon}`);
        if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`);
        const data = await response.json();

        data.results.forEach((entry, index) => {
            const number = index + 1;
            const card = createPokemonCard(number, entry.name, entry.url);
            results.append(card);
            pokemonCards.push(card);
        });

        status.textContent = `${pokemonCards.length} Pokémon loaded`;
        if (pokemonCards.length > 0) selectPokemon(pokemonCards[0]);
    } catch (error) {
        console.error(error);
        status.textContent = "Pokémon could not be loaded.";
        description.textContent = "Check your internet connection and refresh the page.";
    }
}

function createPokemonCard(number, name, url) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pokemon-name";
    card.dataset.name = name;
    card.dataset.number = String(number);
    card.dataset.url = url;
    card.setAttribute("aria-label", `Show ${name} stats`);

    const image = document.createElement("img");
    image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${number}.png`;
    image.alt = name;
    image.loading = "lazy";

    const numberLabel = document.createElement("span");
    numberLabel.className = "pokemon-number";
    numberLabel.textContent = `#${String(number).padStart(3, "0")}`;

    const nameLabel = document.createElement("span");
    nameLabel.className = "pokemon-card-name";
    nameLabel.textContent = name;

    card.append(image, numberLabel, nameLabel);
    card.addEventListener("click", () => selectPokemon(card));
    return card;
}

function filterPokemon(event) {
    const query = event.target.value.trim().toLowerCase();
    const numericQuery = /^\d+$/.test(query) ? String(Number(query)) : null;
    let visible = 0;

    pokemonCards.forEach(card => {
        const matches = !query
            || (numericQuery !== null && card.dataset.number === numericQuery)
            || (numericQuery === null && card.dataset.name.includes(query));
        card.hidden = !matches;
        if (matches) visible++;
    });

    document.getElementById("search-status").textContent = query
        ? `${visible} matching Pokémon`
        : `${visible} Pokémon loaded`;

    const firstMatch = pokemonCards.find(card => !card.hidden);
    if (firstMatch && query) selectPokemon(firstMatch);
}

async function selectPokemon(card) {
    pokemonCards.forEach(item => item.classList.toggle("is-selected", item === card));
    card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    const number = card.dataset.number;
    const name = card.dataset.name;
    const info = document.getElementById("pokemon-info");
    const description = document.getElementById("pokemon-description");
    info.classList.remove("pokemon-change");
    void info.offsetWidth;
    info.classList.add("pokemon-change");

    document.getElementById("pokemon-number").textContent = `#${String(number).padStart(3, "0")}`;
    document.getElementById("pokemon-name").textContent = name.toUpperCase();
    description.textContent = "Loading Pokémon details...";

    try {
        let pokemon = pokemonCache.get(number);
        if (!pokemon) {
            const response = await fetch(card.dataset.url);
            if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`);
            pokemon = await response.json();
            pokemonCache.set(number, pokemon);
        }

        document.getElementById("pokemon-img").src = pokemon.sprites.other?.["official-artwork"]?.front_default
            || pokemon.sprites.front_default;
        document.getElementById("pokemon-img").alt = pokemon.name;
        renderTypes(pokemon.types);
        renderStats(pokemon.stats);
        description.textContent = `Height: ${pokemon.height / 10} m · Weight: ${pokemon.weight / 10} kg`;
    } catch (error) {
        console.error(error);
        description.textContent = "Could not load this Pokémon's details.";
        document.getElementById("stats-list").replaceChildren();
    }
}

function renderTypes(types) {
    const container = document.getElementById("pokemon-types");
    container.replaceChildren();
    types.forEach(({ type }) => {
        const badge = document.createElement("span");
        badge.className = `type-box ${type.name}`;
        badge.textContent = type.name.toUpperCase();
        container.append(badge);
    });
}

function renderStats(stats) {
    const container = document.getElementById("stats-list");
    container.replaceChildren();

    stats.forEach(({ base_stat: value, stat }, index) => {
        const row = document.createElement("div");
        row.className = "stat-row";

        const label = document.createElement("span");
        label.className = "stat-label";
        label.textContent = formatStatName(stat.name);

        const track = document.createElement("div");
        track.className = "stat-track";

        const fill = document.createElement("div");
        fill.className = `stat-fill stat-color-${index}`;
        fill.style.width = `${Math.min(value / statMaximum * 100, 100)}%`;

        const valueLabel = document.createElement("span");
        valueLabel.className = "stat-value";
        valueLabel.textContent = value;

        track.append(fill);
        row.append(label, track, valueLabel);
        container.append(row);
    });
}

function formatStatName(name) {
    return name.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
}
