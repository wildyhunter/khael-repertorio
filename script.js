// IDENTIFICAR A PÁGINA E ESCOLHER A BASE DE DADOS

const currentPage = window.location.pathname.toLowerCase();

const isPortuguese = currentPage.endsWith('index2.html');

const DATABASE_FILE = isPortuguese ? 'musicas-pt.txt' : 'musicas.txt';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const searchInput = document.getElementById('search-input');
const songList = document.getElementById('song-list');
const songCount = document.getElementById('song-count');
const alphabetNav = document.getElementById('alphabet');
const emptyState = document.getElementById('empty-state');

let songs = [];
let activeLetter = isPortuguese ? 'TODAS' : 'ALL';

// TEXTOS CONFORME O IDIOMA

const translations = {
    pt: {
        all: 'TODAS',
        song: 'música',
        songs: 'músicas',
        artist: 'Artista não indicado',
        emptyTitle: 'Não encontrámos essa música.',
        emptyText: 'Experimenta pesquisar outro título ou artista.',
        readyTitle: 'O repertório está pronto para receber músicas',
        readyText: 'Adiciona músicas ao ficheiro musicas-pt.txt.',
        loading: 'A carregar o repertório...',
        error: 'Não foi possível carregar musicas-pt.txt. Confirma se o ficheiro está publicado junto com esta página.',
    },

    en: {
        all: 'ALL',
        song: 'song',
        songs: 'songs',
        artist: 'Artist not specified',
        emptyTitle: 'We couldn’t find that song.',
        emptyText: 'Try searching for a different title or artist.',
        readyTitle: 'The playlist is ready for songs',
        readyText: 'Add songs to the musicas.txt file.',
        loading: 'Loading the playlist...',
        error: 'Could not load musicas.txt. Check that the file is published alongside this page.',
    },
};

const language = isPortuguese ? 'pt' : 'en';
const t = translations[language];

// NORMALIZAR TEXTO E REMOVER ACENTOS

function normalize(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// LER A BASE DE DADOS

function parseDatabase(text) {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('|'))
        .map((line) => {
            const [title, ...artist] = line.split('|');

            return {
                title: title.trim(),
                artist: artist.join('|').trim(),
            };
        })
        .filter((song) => song.title)
        .sort((a, b) =>
            a.title.localeCompare(b.title, language, {
                sensitivity: 'base',
            })
        );
}

// FILTRO ALFABÉTICO

function renderAlphabet() {
    alphabetNav.innerHTML = '';

    [t.all, ...alphabet].forEach((letter) => {
        const button = document.createElement('button');

        button.textContent = letter;
        button.className = activeLetter === letter ? 'active' : '';

        button.addEventListener('click', () => {
            activeLetter = letter;
            render();
        });

        alphabetNav.appendChild(button);
    });
}

// MOSTRAR MÚSICAS

function render() {
    const query = normalize(searchInput.value.trim());

    const filtered = songs.filter((song) => {
        const text = normalize(song.title + ' ' + song.artist);
        const first = normalize(song.title).charAt(0).toUpperCase();

        return (
            (!query || text.includes(query)) &&
            (activeLetter === t.all || first === activeLetter)
        );
    });

    songList.innerHTML = '';

    emptyState.hidden = filtered.length > 0;
    songList.hidden = filtered.length === 0;

    songCount.textContent = `${filtered.length} ${filtered.length === 1 ? t.song : t.songs}`;

    const groups = new Map();

    filtered.forEach((song) => {
        const letter = song.title
            .charAt(0)
            .toLocaleUpperCase(language === 'pt' ? 'pt-PT' : 'en');

        if (!groups.has(letter)) {
            groups.set(letter, []);
        }

        groups.get(letter).push(song);
    });

    [...groups.keys()]
        .sort((a, b) => a.localeCompare(b, language))
        .forEach((letter) => {
            const section = document.createElement('section');
            section.className = 'group';

            const heading = document.createElement('h3');
            heading.className = 'letter';
            heading.textContent = letter;

            section.appendChild(heading);

            groups.get(letter).forEach((song) => {
                const row = document.createElement('div');
                row.className = 'song';

                const symbol = document.createElement('span');
                symbol.className = 'symbol';
                symbol.textContent = '♫';

                const details = document.createElement('div');

                const title = document.createElement('div');
                title.className = 'title';
                title.textContent = song.title;

                const artist = document.createElement('div');
                artist.className = 'artist';
                artist.textContent = song.artist || t.artist;

                details.append(title, artist);
                row.append(symbol, details);

                section.appendChild(row);
            });

            songList.appendChild(section);
        });

    renderAlphabet();
}

// CARREGAR A BASE DE DADOS CORRETA

async function loadSongs() {
    try {
        const response = await fetch(DATABASE_FILE, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        songs = parseDatabase(await response.text());

        emptyState.querySelector('h3').textContent = t.emptyTitle;
        emptyState.querySelector('p').textContent = t.emptyText;

        render();

        if (!songs.length) {
            songList.hidden = true;
            emptyState.hidden = false;

            emptyState.querySelector('h3').textContent = t.readyTitle;
            emptyState.querySelector('p').textContent = t.readyText;

            songCount.textContent = `0 ${t.songs}`;
        }
    } catch (error) {
        songList.hidden = false;
        emptyState.hidden = true;

        songList.innerHTML = '';

        const message = document.createElement('p');
        message.className = 'loading';
        message.textContent = t.error;

        songList.appendChild(message);

        songCount.textContent = 'Error';

        console.error('Database loading error:', error);
    }
}

// PESQUISA EM TEMPO REAL

searchInput.addEventListener('input', render);

// ATALHO CTRL + K PARA PESQUISAR

document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput.focus();
    }
});

// INICIAR

loadSongs();
