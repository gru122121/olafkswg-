// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to extract stats and notes from HTML string
function extractSteamData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract stats
    const statsElements = doc.querySelectorAll('.showcase_stats_trading .showcase_stat .value');
    const stats = statsElements.length >= 3 ? {
        itemsOwned: statsElements[0].textContent.trim(),
        tradesMade: statsElements[1].textContent.trim(),
        marketTransactions: statsElements[2].textContent.trim()
    } : null;

    // Extract showcase notes
    const notesElement = doc.querySelector('.showcase_notes');
    const notes = notesElement ? notesElement.innerHTML.split('<br>') : [];

    return { stats, notes };
}

// Function to update stats and notes display
function updateDisplay(data) {
    // Update stats
    if (data.stats) {
        document.getElementById('items-owned').textContent = formatNumber(data.stats.itemsOwned);
        document.getElementById('trades-made').textContent = formatNumber(data.stats.tradesMade);
        document.getElementById('market-transactions').textContent = formatNumber(data.stats.marketTransactions);
    }

    // Update notes
    const contactSection = document.querySelector('.contact-section');
    if (data.notes && data.notes.length > 0) {
        contactSection.innerHTML = `
            <h2>Showcase</h2>
            ${data.notes.map(note => `<p class="showcase-note">${note.trim()}</p>`).join('')}
        `;
    }
}

// Function to fetch Steam profile data
async function fetchSteamData() {
    try {
        const corsProxy = 'https://corsproxy.io/';
        const steamUrl = 'https://steamcommunity.com/id/olafkswg';
        
        const response = await fetch(corsProxy + steamUrl);
        if (!response.ok) throw new Error('Failed to fetch data');

        const html = await response.text();
        const data = extractSteamData(html);
        updateDisplay(data);
        
        // Cache the data
        localStorage.setItem('steamData', JSON.stringify({
            data,
            timestamp: Date.now()
        }));

    } catch (error) {
        console.error('Error fetching Steam data:', error);
        
        // Try to use cached data
        const cached = localStorage.getItem('steamData');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 3600000) {
                updateDisplay(data);
                return;
            }
        }
        
        // Show loading state
        updateDisplay({
            stats: {
                itemsOwned: '...',
                tradesMade: '...',
                marketTransactions: '...'
            },
            notes: []
        });
    }
}

// Initialize with loading state
document.querySelectorAll('.stat-value').forEach(el => {
    el.textContent = '...';
});

// Try to show cached stats immediately
const cached = localStorage.getItem('steamData');
if (cached) {
    const { data } = JSON.parse(cached);
    updateDisplay(data);
}

// Fetch fresh stats
fetchSteamData();

// Update every 5 minutes
setInterval(fetchSteamData, 300000); 