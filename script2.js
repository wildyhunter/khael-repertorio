
// ==========================================
// KHAEL SINGER - VERSÃO PORTUGUESA
// BASE DE DADOS: musicas-pt.txt
// ==========================================

const DATABASE_FILE = 'musicas-pt.txt';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const searchInput = document.getElementById('search-input');
const songList = document.getElementById('song-list');
const songCount = document.getElementById('song-count');
const alphabetNav = document.getElementById('alphabet');
const emptyState = document.getElementById('empty-state');

let songs = [];
let activeLetter = 'TODAS';

// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalize(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// ==========================================
// LER A BASE DE DADOS
// ==========================================

function parseDatabase(text) {
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line =>
            line &&
            !line.startsWith('#') &&
            line.includes('|')
        )
        .map(line => {
            const [title, ...artist] = line.split('|');

            return {
                title: title.trim(),
                artist: artist.join('|').trim()
            };
        })
        .filter(song => song.title)
        .sort((a, b) =>
            a.title.localeCompare(b.title, 'pt', {
                sensitivity: 'base'
            })
        );
}

// ==========================================
// FILTRO ALFABÉTICO
// ==========================================

function renderAlphabet() {
    alphabetNav.innerHTML = '';

    ['TODAS', ...alphabet].forEach(letter => {
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

// ==========================================
// MOSTRAR MÚSICAS
// ==========================================

function render() {
    const query = normalize(searchInput.value.trim());

    const filtered = songs.filter(song => {
        const text = normalize(song.title + ' ' + song.artist);
        const first = normalize(song.title).charAt(0).toUpperCase();

        return (
            (!query || text.includes(query)) &&
            (activeLetter === 'TODAS' || first === activeLetter)
        );
    });

    songList.innerHTML = '';

    emptyState.hidden = filtered.length > 0;
    songList.hidden = filtered.length === 0;

    songCount.textContent =
        `${filtered.length} ${filtered.length === 1 ? 'música' : 'músicas'}`;

    const groups = new Map();

    filtered.forEach(song => {
        const letter = song.title
            .charAt(0)
            .toLocaleUpperCase('pt-PT');

        if (!groups.has(letter)) {
            groups.set(letter, []);
        }

        groups.get(letter).push(song);
    });

    [...groups.keys()]
        .sort((a, b) => a.localeCompare(b, 'pt'))
        .forEach(letter => {
            const section = document.createElement('section');
            section.className = 'group';

            const heading = document.createElement('h3');
            heading.className = 'letter';
            heading.textContent = letter;

            section.appendChild(heading);

            groups.get(letter).forEach(song => {
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
                artist.textContent = song.artist || 'Artista não indicado';

                details.append(title, artist);
                row.append(symbol, details);

                section.appendChild(row);
            });

            songList.appendChild(section);
        });

    renderAlphabet();
}

// ==========================================
// CARREGAR APENAS musicas-pt.txt
// ==========================================

async function loadSongs() {
    try {
        const response = await fetch(DATABASE_FILE, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        songs = parseDatabase(await response.text());

        emptyState.querySelector('h3').textContent =
            'Não encontrámos essa música.';

        emptyState.querySelector('p').textContent =
            'Experimenta pesquisar outro título ou artista.';

        render();

        if (!songs.length) {
            songList.hidden = true;
            emptyState.hidden = false;

            emptyState.querySelector('h3').textContent =
                'O repertório está pronto para receber músicas';

            emptyState.querySelector('p').textContent =
                'Adiciona músicas ao ficheiro musicas-pt.txt.';

            songCount.textContent = '0 músicas';
        }

        console.log('Base de dados portuguesa carregada:', DATABASE_FILE);
        console.log('Total de músicas:', songs.length);

    } catch (error) {
        songList.hidden = false;
        emptyState.hidden = true;

        songList.innerHTML = '';

        const message = document.createElement('p');
        message.className = 'loading';
        message.textContent =
            'Não foi possível carregar musicas-pt.txt. Confirma se o ficheiro está publicado junto com esta página.';

        songList.appendChild(message);

        songCount.textContent = 'Erro ao carregar';

        console.error('Erro ao carregar repertório português:', error);
    }
}

// ==========================================
// PESQUISA EM TEMPO REAL
// ==========================================

searchInput.addEventListener('input', render);

// ==========================================
// ATALHO CTRL + K
// ==========================================

document.addEventListener('keydown', event => {
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'
    ) {
        event.preventDefault();
        searchInput.focus();
    }
});

// ==========================================
// INICIAR
// ==========================================

loadSongs();
