class TrendingCard extends HTMLElement {
    constructor() {
        super();
        this.trend = {
            name: 'trend',
            isRTL: true,
        };
        this.content = document.createElement('span');
        this.content.className = 'grid-content';
        this.text = document.createElement('a');
        this.text.className = 'grid-item';

        this.text.textContent = 'trend trend trend';
        this.content.appendChild(this.text);
        this.appendChild(this.content);
        this.update();
    }

    async animateWord() {
        for (let letter of this.trend.name) {
            this.text.textContent += letter;
            await sleep(150 + Math.random() * 500);
        }
    }

    async update() {
        while (true) {
            this.text.textContent = '';
            this.trend = getNextTrend();
            // this.trend = getRandomTrend();
            this.text.style.direction = this.trend.isRTL ? 'rtl' : 'ltr';
            this.content.style.direction = this.trend.isRTL ? 'rtl' : 'ltr';
            await this.animateWord();
            await sleep(TREND_SHUFFLE_INTERVAL_SECONDS * 1000);
        }
    }
}


// add 'trending-card' to custom element registry
customElements.define("trending-card", TrendingCard);


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function getTrends() {
    const res = await fetch(TWITTER_TRENDING_API_ENDPOINT);
    trends = await res.json();

    // TODO: temp hack
    trends = trends.filter(item => item.name !== "#omar_forever");
    // trends = trends.filter(item => !item.name.includes("omar"));

    // sort based on tweet_volume
    trends.sort((a, b) => (a.tweet_volume > b.tweet_volume) ? -1 : 1);
    // get top N trends only
    trends = trends.slice(0, TOP_N_TRENDS_LIMIT);
    _updateTrends();
}

function _updateTrends() {
    console.log("_updateTrends");
    console.log(trends);
    for (let trend of trends) {
        trend.name = trend.name.replaceAll('#', '');
        trend.name = trend.name.replaceAll('_', ' ');
        trend.isRTL = isRTL(trend.name[0]);
    }
    draw();
}

function isRTL(s) {
    var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
        rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
        rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']');

    return rtlDirCheck.test(s);
}


function getRandomTrend() {
    return trends[Math.floor(Math.random() * trends.length)];
}

function getNextTrend() {
    // reset current_trend_index
    if (current_trend_index === trends.length) {
        current_trend_index = 0;
    }
    return trends[current_trend_index++];
}


function draw() {
    const cardsContainer = document.getElementById('container');
    if (cardsContainer.childElementCount === 0) {
        for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
            cardsContainer.appendChild(new TrendingCard());
        }
    }
}

// ---------------------- Main ----------------------
// constants
const TWITTER_TRENDING_API_ENDPOINT = "https://trending-api.alfozan.io/trends";
const TREND_SHUFFLE_INTERVAL_SECONDS = 6
const TRENDS_FETCH_INTERVAL_SECONDS = 3 * 60 // 3 min

// vars
let trends = [];
let current_trend_index = 0;
let TOP_N_TRENDS_LIMIT = 25;
let NUMBER_OF_COLUMNS = 3;

// parse HTTP GET params
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

// read number of columns and set it if present
ncols = findGetParameter("ncols");
if (ncols) {
    NUMBER_OF_COLUMNS = parseInt(ncols);
}

function onBodyLoads() {
    getTrends(); // first time
    // set up a timer to fetch updates
    setInterval(() => {
        getTrends();
    }, TRENDS_FETCH_INTERVAL_SECONDS * 1000);
}

