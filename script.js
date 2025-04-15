const jobKeywordsInput = document.getElementById('job-keywords');
const excludeKeywordsInput = document.getElementById('exclude-keywords');
const queryPreview = document.getElementById('query-preview');
const buildSearchButton = document.getElementById('build-search');
const paginationContainer = document.getElementById('pagination');
const resultsContainer = document.getElementById('results');

const siteOptions = [
    'greenhouse.io', 'lever.co', 'linkedin.com/jobs', 'jobs.google.com', 'jobs.lever.co', 'jobs.ashbyhq.com', 'jobs.workable.com',
    'apply.workable.com', 'jobs.smartrecruiters.com', 'jobs.jobvite.com', 'jobs.recruitee.com',
    'jobs.breezy.hr', 'jobs.indeed.com', 'jobs.ziprecruiter.com', 'jobs.angel.co', 'wellfound.com',
    'weworkremotely.com', 'remoteok.com', 'flexjobs.com', 'remotive.io', 'jobspresso.co',
    'workingnomads.co', 'stackoverflow.com/jobs', 'remote.co', 'wfh.io', 'justremote.co',
    'ycombinator.com/jobs', 'python.org/jobs', 'jobs.djangojobs.net', 'jobs.builtin.com',
    'arc.dev', 'jobs.rippling.com', 'app.dover.io', 'jobs.kenjo.io', 'hired.com', 'landing.jobs',
    'hackajob.com', 'talent.io', 'gun.io', 'functionaljobs.com', '4dayweek.io', 'devsnap.io',
    'rustjobs.dev', 'golangprojects.com', 'reactjsjobs.com', 'vuejobs.com', 'pythonjobs.github.io',
    'rubyjobs.dev', 'frontendjobs.tech', 'techjobsforgood.com', 'techrally.co', 'remote.ml',
    'datayoshi.com', 'cryptocurrencyjobs.co', 'web3.career', 'devitjobs.uk/jobs/remote',
    'relocate.me', 'workatastartup.com', 'uxjobsboard.com', 'protege.dev',
    'remoteintech.company', 'underdog.io', 'triplebyte.com'
];

let selectedKeywords = [];
let excludedKeywords = [];
let selectedSites = [];
let currentPage = 1;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', () => {
    const sitesContainer = document.getElementById('job-board-checkboxes');
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // Populate checkboxes inside dropdown
    siteOptions.forEach(site => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = site;
        checkbox.id = `site-${site}`;
        checkbox.classList.add('site-checkbox');

        const label = document.createElement('label');
        label.htmlFor = `site-${site}`;
        label.textContent = site;

        const wrapper = document.createElement('div');
        wrapper.classList.add('checkbox-item');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        sitesContainer.appendChild(wrapper);
    });

    // Toggle dropdown visibility
    dropdownToggle.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown on click outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.dropdown')) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Update selectedSites on checkbox change
    sitesContainer.addEventListener('change', () => {
        selectedSites = Array.from(document.querySelectorAll('.site-checkbox:checked')).map(cb => cb.value);
        updateQueryPreview();
    });
});

// Adds tag visually + to data
function addKeyword(tag, type) {
    const tagElement = document.createElement('div');
    tagElement.classList.add('tag');
    tagElement.textContent = tag;

    const removeBtn = document.createElement('span');
    removeBtn.classList.add('remove-btn');
    removeBtn.textContent = 'x';
    removeBtn.onclick = (e) => removeTag(tag, type, e);
    tagElement.appendChild(removeBtn);

    const container = type === 'keyword' ? document.getElementById('keywords-tags') : document.getElementById('exclude-tags');
    container.appendChild(tagElement);
}

// Remove a tag
function removeTag(tag, type, event) {
    if (type === 'keyword') {
        selectedKeywords = selectedKeywords.filter(item => item !== tag);
    } else {
        excludedKeywords = excludedKeywords.filter(item => item !== tag);
    }
    updateQueryPreview();
    event.target.parentElement.remove();
}

// Add keyword on Enter
function handleKeywordInput(inputElement, typeArray, type) {
    inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = inputElement.value.trim();
            if (value && !typeArray.includes(value)) {
                typeArray.push(value);
                addKeyword(value, type);
                updateQueryPreview();
            }
            inputElement.value = '';
        }
    });
}

handleKeywordInput(jobKeywordsInput, selectedKeywords, 'keyword');
handleKeywordInput(excludeKeywordsInput, excludedKeywords, 'exclude');

// Update Query Preview
function updateQueryPreview() {
    let queryParts = [];

    if (selectedKeywords.length > 0) {
        queryParts.push(`"${selectedKeywords.join('" AND "')}"`);
    }

    if (excludedKeywords.length > 0) {
        queryParts.push(selectedKeywords.length > 0 ? `-${excludedKeywords.join(' -')}` : `-${excludedKeywords.join(' -')}`);
    }

    if (selectedSites.length > 0) {
        queryParts.push(`AND (${selectedSites.map(site => `site:${site}`).join(' OR ')})`);
    }

    queryPreview.value = queryParts.join(' ').trim();
}

// Perform search
buildSearchButton.addEventListener('click', async () => {
    const finalQuery = queryPreview.value;

    if (!finalQuery) {
        alert('Please build a valid query before searching.');
        return;
    }

    currentPage = 1;
    totalPages = 1;
    paginationContainer.innerHTML = '';

    try {
        await performSearch(finalQuery, currentPage);
    } catch (error) {
        console.error('Error fetching search results:', error);
        alert('Something went wrong while fetching the search results.');
    }
});

async function performSearch(query, page) {
    const startIndex = (page - 1) * 10 + 1;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://job-search-api-rho.vercel.app/api/search?q=${encodedQuery}&start=${startIndex}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error.message);
            alert(`Error: ${data.error.message}`);
            return;
        }

        if (data.items) {
            displayResults(data.items);
            handlePagination(data.queries);
        } else {
            resultsContainer.innerHTML = '<p>No results found</p>';
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        alert('An error occurred while fetching search results.');
    }
}

function displayResults(results) {
    resultsContainer.innerHTML = '';

    if (results.length > 0) {
        results.forEach(item => {
            const resultElement = document.createElement('div');
            resultElement.classList.add('result-item');

            resultElement.innerHTML = `
                <div class="result-title"><a href="${item.link}" target="_blank">${item.title}</a></div>
                <div class="result-snippet">${item.snippet}</div>
            `;
            resultsContainer.appendChild(resultElement);
        });
    } else {
        resultsContainer.innerHTML = '<p>No results found</p>';
    }
}

function handlePagination(queries) {
    paginationContainer.innerHTML = '';

    if (queries && queries.previousPage) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.onclick = () => {
            currentPage--;
            performSearch(queryPreview.value, currentPage);
        };
        paginationContainer.appendChild(prevBtn);
    }

    if (queries && queries.nextPage) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => {
            currentPage++;
            performSearch(queryPreview.value, currentPage);
        };
        paginationContainer.appendChild(nextBtn);
    }
}
