// API Configuration for Unified Supplement Service

const apiConfig = {
    dsld: {
        baseURL: 'https://api.ods.od.nih.gov/dsld/v9',
        // NIH DSLD API doesn't require API key
        apiKey: null
    },
    imd: {
        baseURL: window.config?.APIS?.IMD_API_URL || 'https://api.imd.jp/fdb',
        apiKey: window.config?.APIS?.IMD_API_KEY || '',
        vpsEndpoint: window.config?.APIS?.IMD_VPS_ENDPOINT || '',
        sourceIP: 'client-side' // Will be handled by server proxy
    }
};

// Region settings
const regionConfig = {
    US: {
        locale: 'en-US',
        currency: 'USD',
        units: {
            weight: 'oz',
            volume: 'fl oz'
        },
        api: 'dsld'
    },
    JP: {
        locale: 'ja-JP',
        currency: 'JPY',
        units: {
            weight: 'g',
            volume: 'ml'
        },
        api: 'imd'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiConfig, regionConfig };
}