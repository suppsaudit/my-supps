// Vercel API Route - IMD API Proxy for Global Access
// Bypasses regional restrictions to ensure users worldwide can access Japanese supplement data

export default async function handler(req, res) {
    // Enable CORS for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const { endpoint, ...params } = req.query;
        
        // Validate endpoint parameter
        if (!endpoint) {
            return res.status(400).json({
                error: 'Missing endpoint parameter',
                usage: '/api/imd-proxy?endpoint=search&query=vitamin'
            });
        }
        
        // IMD API configuration
        const IMD_BASE_URL = process.env.IMD_API_URL || 'https://api.imd.co.jp/v1';
        const IMD_API_KEY = process.env.IMD_API_KEY;
        
        if (!IMD_API_KEY) {
            return res.status(500).json({
                error: 'IMD API key not configured',
                message: 'Server configuration incomplete'
            });
        }
        
        let apiUrl;
        let requestOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${IMD_API_KEY}`,
                'User-Agent': 'MY-SUPPS-Global-Proxy/1.0',
                'Accept': 'application/json'
            }
        };
        
        // Route to appropriate IMD endpoint
        switch (endpoint) {
            case 'search':
                apiUrl = `${IMD_BASE_URL}/supplements/search`;
                if (req.method === 'POST') {
                    requestOptions.body = JSON.stringify(req.body);
                } else {
                    // Convert query parameters for GET request
                    const searchParams = new URLSearchParams();
                    if (params.query) searchParams.append('q', params.query);
                    if (params.category) searchParams.append('category', params.category);
                    if (params.brand) searchParams.append('brand', params.brand);
                    if (params.limit) searchParams.append('limit', params.limit);
                    apiUrl += `?${searchParams.toString()}`;
                }
                break;
                
            case 'product':
                const productId = params.id || params.jan_code;
                if (!productId) {
                    return res.status(400).json({
                        error: 'Missing product ID or JAN code',
                        usage: '/api/imd-proxy?endpoint=product&id=4987654321'
                    });
                }
                apiUrl = `${IMD_BASE_URL}/supplements/${productId}`;
                break;
                
            case 'categories':
                apiUrl = `${IMD_BASE_URL}/categories`;
                break;
                
            case 'brands':
                apiUrl = `${IMD_BASE_URL}/brands`;
                if (params.limit) {
                    apiUrl += `?limit=${params.limit}`;
                }
                break;
                
            case 'popular':
                apiUrl = `${IMD_BASE_URL}/supplements/popular`;
                if (params.limit) {
                    apiUrl += `?limit=${params.limit}`;
                }
                break;
                
            case 'barcode':
                const barcode = params.code;
                if (!barcode) {
                    return res.status(400).json({
                        error: 'Missing barcode parameter',
                        usage: '/api/imd-proxy?endpoint=barcode&code=4987654321098'
                    });
                }
                apiUrl = `${IMD_BASE_URL}/supplements/barcode/${barcode}`;
                break;
                
            default:
                return res.status(400).json({
                    error: `Unknown endpoint: ${endpoint}`,
                    available: ['search', 'product', 'categories', 'brands', 'popular', 'barcode']
                });
        }
        
        console.log(`🌍 Proxying request to IMD API: ${apiUrl}`);
        
        // Make request to IMD API
        const response = await fetch(apiUrl, requestOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ IMD API error (${response.status}):`, errorText);
            
            return res.status(response.status).json({
                error: 'IMD API request failed',
                status: response.status,
                message: errorText
            });
        }
        
        const data = await response.json();
        
        // Add proxy metadata
        const proxyResponse = {
            data: data,
            meta: {
                source: 'IMD',
                region: 'JP',
                proxied: true,
                timestamp: new Date().toISOString(),
                endpoint: endpoint
            }
        };
        
        console.log(`✅ Successfully proxied IMD API request for endpoint: ${endpoint}`);
        
        // Return the proxied data
        res.status(200).json(proxyResponse);
        
    } catch (error) {
        console.error('❌ IMD Proxy Error:', error);
        
        res.status(500).json({
            error: 'Internal proxy error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Configuration for Vercel
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
        responseLimit: '8mb',
    },
    regions: ['hnd1', 'iad1', 'sfo1'], // Tokyo, Virginia, San Francisco for global coverage
    maxDuration: 10, // 10 seconds timeout
}