import * as SecureStore from './storage';

/**
 * Safely parses any date string/timestamp and calculates elapsed seconds since startedAt,
 * correctly handling UTC vs Local timezone shifts (e.g. 5.5h IST drift, 19800 seconds).
 */
export function calculateElapsedSeconds(startedAt, timeOffsetMs = 0) {
    if (!startedAt) return 0;

    let startedMs;
    if (startedAt instanceof Date) {
        startedMs = startedAt.getTime();
    } else if (typeof startedAt === 'number') {
        startedMs = startedAt;
    } else {
        const str = String(startedAt).trim();
        // If string contains explicit timezone indicator (e.g., 'Z', '+05:30', '-04:00')
        if (str.includes('Z') || /[+-]\d{2}:\d{2}$/.test(str)) {
            startedMs = new Date(str).getTime();
        } else {
            // No timezone provided (e.g. "2026-09-07 13:20:00" or "2026-09-07T13:20:00")
            // Try parsing as ISO UTC with Z and also as local time
            const withZ = new Date(str.replace(' ', 'T') + 'Z').getTime();
            const local = new Date(str.replace(' ', 'T')).getTime();

            const now = Date.now() + timeOffsetMs;
            // Pick whichever is closer to current time
            if (!isNaN(withZ) && !isNaN(local)) {
                startedMs = Math.abs(now - withZ) < Math.abs(now - local) ? withZ : local;
            } else if (!isNaN(withZ)) {
                startedMs = withZ;
            } else {
                startedMs = local;
            }
        }
    }

    if (isNaN(startedMs)) return 0;

    const nowMs = Date.now() + timeOffsetMs;
    let elapsed = Math.floor((nowMs - startedMs) / 1000);

    // Timezone 5.5h (19800s) IST drift correction
    // If the database or server clock had a 5.5h timezone offset mismatch:
    if (elapsed > 18000 && elapsed < 21600) {
        elapsed -= 19800;
    } else if (elapsed < -18000 && elapsed > -21600) {
        elapsed += 19800;
    }

    // Safety clamps:
    // If elapsed is slightly negative (minor clock drift between client & server), clamp to 0
    if (elapsed < 0) elapsed = 0;
    // If elapsed is absurdly huge (> 24 hours), something is corrupted
    if (elapsed > 86400) elapsed = 0;

    return elapsed;
}

/**
 * Returns the current server time offset in milliseconds from storage
 */
export function getTimeOffset() {
    const offsetStr = SecureStore.getMemoryItem('time_offset');
    return offsetStr ? parseInt(offsetStr, 10) || 0 : 0;
}

/**
 * Calculates the exact remaining seconds for a task:
 * baseDuration - elapsedSeconds
 */
export function calculateRemainingSeconds(task, timeOffsetMs = null) {
    if (!task) return 0;

    const offset = timeOffsetMs !== null ? timeOffsetMs : getTimeOffset();

    const baseSeconds = task.remaining_seconds !== undefined && task.remaining_seconds !== null
        ? Number(task.remaining_seconds)
        : (Number(task.duration_seconds) || 0);

    if (task.status !== 'RUNNING' || !task.started_at) {
        return Math.max(0, baseSeconds);
    }

    const elapsed = calculateElapsedSeconds(task.started_at, offset);
    const remaining = baseSeconds - elapsed;
    return Math.max(0, remaining);
}

/**
 * Formats seconds into MM:SS (or HH:MM:SS if >= 1 hour)
 */
export function formatTime(secs) {
    const s = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const secStr = sec < 10 ? `0${sec}` : `${sec}`;
    if (h > 0) {
        const minStr = m < 10 ? `0${m}` : `${m}`;
        return `${h}:${minStr}:${secStr}`;
    }
    return `${m}:${secStr}`;
}

// Dynamic runtime cache of product English names to Hindi names
const productHindiCache = new Map();

/**
 * Register known product name -> hindi_name mapping from any backend response
 */
export function registerProductHindiName(engName, hindiName) {
    if (!engName || !hindiName) return;
    const cleanEng = String(engName).trim().toLowerCase();
    const cleanHindi = String(hindiName).trim();
    if (cleanEng && cleanHindi && cleanEng !== cleanHindi.toLowerCase()) {
        productHindiCache.set(cleanEng, cleanHindi);
    }
}

// Comprehensive vegetable dictionary for Ranbhaji kitchen items
const VEGETABLE_HINDI_DICTIONARY = {
    'hybrid tomato': 'टमाटर',
    'tomato': 'टमाटर',
    'tamatar': 'टमाटर',
    'potato': 'आलू',
    'aloo': 'आलू',
    'alu': 'आलू',
    'onion': 'प्याज',
    'pyaz': 'प्याज',
    'garlic': 'लहसुन',
    'lahsun': 'लहसुन',
    'ginger': 'अदरक',
    'adrak': 'अदरक',
    'green chilli': 'हरी मिर्च',
    'chilli': 'मिर्च',
    'mirchi': 'मिर्च',
    'mirch': 'मिर्च',
    'coriander': 'धनिया',
    'dhaniya': 'धनिया',
    'spinach': 'पालक',
    'palak': 'पालक',
    'fenugreek': 'मेथी',
    'methi': 'मेथी',
    'cabbage': 'पत्तागोभी',
    'patta gobhi': 'पत्तागोभी',
    'pattagobhi': 'पत्तागोभी',
    'cauliflower': 'फूलगोभी',
    'phool gobhi': 'फूलगोभी',
    'phoolgobhi': 'फूलगोभी',
    'gobhi': 'गोभी',
    'carrot': 'गाजर',
    'gajar': 'गाजर',
    'radish': 'मूली',
    'mooli': 'मूली',
    'muli': 'मूली',
    'beetroot': 'चुकंदर',
    'chukandar': 'चुकंदर',
    'capsicum': 'शिमला मिर्च',
    'shimla mirch': 'शिमला मिर्च',
    'bell pepper': 'शिमला मिर्च',
    'brinjal': 'बैंगन',
    'eggplant': 'बैंगन',
    'baingan': 'बैंगन',
    'lady finger': 'भिंडी',
    'ladyfinger': 'भिंडी',
    'okra': 'भिंडी',
    'bhindi': 'भिंडी',
    'bottle gourd': 'लौकी',
    'lauki': 'लौकी',
    'ghiya': 'लौकी',
    'bitter gourd': 'करेला',
    'karela': 'करेला',
    'ridge gourd': 'तुरई',
    'turai': 'तुरई',
    'tori': 'तोरई',
    'sponge gourd': 'गिलकी',
    'gilki': 'गिलकी',
    'pumpkin': 'कद्दू',
    'kaddu': 'कद्दू',
    'green peas': 'मटर',
    'peas': 'मटर',
    'matar': 'मटर',
    'cucumber': 'खीरा',
    'kheera': 'खीरा',
    'kakdi': 'ककड़ी',
    'mint': 'पुदीना',
    'pudina': 'पुदीना',
    'curry leaves': 'कढ़ी पत्ता',
    'kadi patta': 'कढ़ी पत्ता',
    'lemon': 'नींबू',
    'nimbu': 'नींबू',
    'mushroom': 'मशरूम',
    'sweet potato': 'शकरकंद',
    'shakarkand': 'शकरकंद',
    'french beans': 'बीन्स',
    'beans': 'बीन्स',
    'raw banana': 'कच्चा केला',
    'kela': 'केला',
    'drumstick': 'सहजन',
    'sahjan': 'सहजन',
    'raw mango': 'कच्चा आम / कैरी',
    'kairi': 'कैरी',
    'capsicum green': 'हरी शिमला मिर्च',
    'capsicum red': 'लाल शिमला मिर्च',
    'capsicum yellow': 'पीली शिमला मिर्च',
    'ginger garlic paste': 'अदरक लहसुन पेस्ट',
    'shepu': 'सोया भाजी / शेपू',
    'dill leaves': 'शेपू',
    'colocasia': 'अरबी',
    'arbi': 'अरबी',
    'sweet corn': 'मक्का / कॉर्न',
    'corn': 'मक्का',
    'chana': 'चना',
    'cluster beans': 'ग्वार फली',
    'gawar': 'ग्वार फली',
};

/**
 * Finds the Hindi name for a vegetable name using direct matching, cache, or keyword search
 */
function findHindiNameForProduct(engName) {
    if (!engName) return '';
    const clean = engName.trim().toLowerCase();

    // 1. Check dynamic runtime cache
    if (productHindiCache.has(clean)) {
        return productHindiCache.get(clean);
    }

    // 2. Check exact match in dictionary
    if (VEGETABLE_HINDI_DICTIONARY[clean]) {
        return VEGETABLE_HINDI_DICTIONARY[clean];
    }

    // 3. Substring/keyword matching (e.g. "hybrid tomato 500g" -> "टमाटर")
    for (const [key, hindiVal] of Object.entries(VEGETABLE_HINDI_DICTIONARY)) {
        if (clean.includes(key)) {
            return hindiVal;
        }
    }

    return '';
}

/**
 * Formats a vegetable/product name to display with its Hindi name in brackets.
 * E.g. "Hybrid Tomato (टमाटर)" or "Potato (आलू)"
 * @param {Object} item
 * @returns {string}
 */
export function formatProductName(item) {
    if (!item) return '';

    // Extract English name from various possible backend response shapes
    const engName = (
        item.Product?.name ||
        item.product?.name ||
        item.name ||
        item.productName ||
        item.product_name ||
        ''
    ).trim();

    // Extract Hindi name from various possible backend response shapes
    let hindiName = (
        item.Product?.hindi_name ||
        item.Product?.productHindiName ||
        item.product?.hindi_name ||
        item.product?.productHindiName ||
        item.hindi_name ||
        item.hindiName ||
        item.productHindiName ||
        item.product_hindi_name ||
        ''
    ).trim();

    // If Hindi name was found on the item, register it in the runtime cache
    if (engName && hindiName && engName.toLowerCase() !== hindiName.toLowerCase()) {
        registerProductHindiName(engName, hindiName);
        return `${engName} (${hindiName})`;
    }

    // If Hindi name was NOT provided directly by backend, look it up in dictionary/cache!
    if (engName) {
        const lookedUpHindi = findHindiNameForProduct(engName);
        if (lookedUpHindi && engName.toLowerCase() !== lookedUpHindi.toLowerCase()) {
            return `${engName} (${lookedUpHindi})`;
        }
    }

    // If only Hindi name was provided and no English name
    if (!engName && hindiName) {
        return hindiName;
    }

    return engName || hindiName || 'Vegetable Item';
}
