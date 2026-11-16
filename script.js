
// ==========================================
// KHAEL SINGER - ENGLISH VERSION
// DATABASE: musicas.txt
// ==========================================

const DATABASE_FILE = 'musicas.txt';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const searchInput = document.getElementById('search-input');
const songList = document.getElementById('song-list');
const songCount = document.getElementById('song-count');
const alphabetNav = document.getElementById('alphabet');
const emptyState = document.getElementById('empty-state');

let songs = [];
let activeLetter = 'ALL';

// ==========================================
// NORMALIZE TEXT
// ==========================================

function normalize(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// ==========================================
// READ DATABASE
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
            a.title.localeCompare(b.title, 'en', {
                sensitivity: 'base'
            })
        );
}

// ==========================================
// ALPHABET FILTER
// ==========================================

function renderAlphabet() {
    alphabetNav.innerHTML = '';

    ['ALL', ...alphabet].forEach(letter => {
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
// DISPLAY SONGS
// ==========================================

function render() {
    const query = normalize(searchInput.value.trim());

    const filtered = songs.filter(song => {
        const text = normalize(song.title + ' ' + song.artist);
        const first = normalize(song.title).charAt(0).toUpperCase();

        return (
            (!query || text.includes(query)) &&
            (activeLetter === 'ALL' || first === activeLetter)
        );
    });

    songList.innerHTML = '';

    emptyState.hidden = filtered.length > 0;
    songList.hidden = filtered.length === 0;

    songCount.textContent =
        `${filtered.length} ${filtered.length === 1 ? 'song' : 'songs'}`;

    const groups = new Map();

    filtered.forEach(song => {
        const letter = song.title.charAt(0).toLocaleUpperCase('en');

        if (!groups.has(letter)) {
            groups.set(letter, []);
        }

        groups.get(letter).push(song);
    });

    [...groups.keys()]
        .sort((a, b) => a.localeCompare(b, 'en'))
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
                artist.textContent = song.artist || 'Artist not specified';

                details.append(title, artist);
                row.append(symbol, details);

                section.appendChild(row);
            });

            songList.appendChild(section);
        });

    renderAlphabet();
}

// ==========================================
// LOAD ENGLISH DATABASE
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
            'We couldn’t find that song.';

        emptyState.querySelector('p').textContent =
            'Try searching for a different title or artist.';

        render();

        if (!songs.length) {
            songList.hidden = true;
            emptyState.hidden = false;

            emptyState.querySelector('h3').textContent =
                'The playlist is ready for songs';

            emptyState.querySelector('p').textContent =
                'Add songs to the musicas.txt file.';

            songCount.textContent = '0 songs';
        }

        console.log('English database loaded:', DATABASE_FILE);
        console.log('Total songs:', songs.length);

    } catch (error) {
        songList.hidden = false;
        emptyState.hidden = true;

        songList.innerHTML = '';

        const message = document.createElement('p');
        message.className = 'loading';
        message.textContent =
            'Could not load musicas.txt. Check that the file is published alongside this page.';

        songList.appendChild(message);

        songCount.textContent = 'Loading error';

        console.error('Database loading error:', error);
    }
}

// ==========================================
// LIVE SEARCH
// ==========================================

searchInput.addEventListener('input', render);

// ==========================================
// CTRL + K SEARCH SHORTCUT
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
// START
// ==========================================

loadSongs();
