// Vercel API Route - Health Check for All APIs
// Monitors DSLD and IMD API availability with regional status

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const healthStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        apis: {
            dsld: {
                status: 'unknown',
                region: 'US',
                responseTime: null,
                error: null
            },
            imd: {
                status: 'unknown',
                region: 'JP',
                responseTime: null,
                error: null,
                proxied: true
            }
        },
        proxy: {
            status: 'operational',
            version: '1.0.0',
            region: process.env.VERCEL_REGION || 'unknown'
        }
    };
    
    // Check DSLD API (direct)
    try {
        const dsldStart = Date.now();
        const dsldResponse = await fetch('https://api.ods.od.nih.gov/dsld/v1/search?query=vitamin', {
            method: 'GET',
            headers: {
                'User-Agent': 'MY-SUPPS-Health-Check/1.0'
            },
            timeout: 5000
        });
        
        healthStatus.apis.dsld.responseTime = Date.now() - dsldStart;
        
        if (dsldResponse.ok) {
            healthStatus.apis.dsld.status = 'healthy';
        } else {
            healthStatus.apis.dsld.status = 'degraded';
            healthStatus.apis.dsld.error = `HTTP ${dsldResponse.status}`;
        }
    } catch (error) {
        healthStatus.apis.dsld.status = 'unhealthy';
        healthStatus.apis.dsld.error = error.message;
    }
    
    // Check IMD API (through proxy)
    try {
        const imdStart = Date.now();
        
        // Check if IMD API key is configured
        if (!process.env.IMD_API_KEY) {
            healthStatus.apis.imd.status = 'unconfigured';
            healthStatus.apis.imd.error = 'API key not configured';
        } else {
            const IMD_BASE_URL = process.env.IMD_API_URL || 'https://api.imd.co.jp/v1';
            
            const imdResponse = await fetch(`${IMD_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.IMD_API_KEY}`,
                    'User-Agent': 'MY-SUPPS-Health-Check/1.0',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            healthStatus.apis.imd.responseTime = Date.now() - imdStart;
            
            if (imdResponse.ok) {
                healthStatus.apis.imd.status = 'healthy';
            } else {
                healthStatus.apis.imd.status = 'degraded';
                healthStatus.apis.imd.error = `HTTP ${imdResponse.status}`;
            }
        }
    } catch (error) {
        healthStatus.apis.imd.status = 'unhealthy';
        healthStatus.apis.imd.error = error.message;
    }
    
    // Determine overall status
    const apiStatuses = [healthStatus.apis.dsld.status, healthStatus.apis.imd.status];
    
    if (apiStatuses.includes('unhealthy')) {
        healthStatus.status = 'degraded';
    } else if (apiStatuses.includes('degraded') || apiStatuses.includes('unconfigured')) {
        healthStatus.status = 'partial';
    } else {
        healthStatus.status = 'healthy';
    }
    
    // Add performance metrics
    healthStatus.performance = {
        totalResponseTime: (healthStatus.apis.dsld.responseTime || 0) + (healthStatus.apis.imd.responseTime || 0),
        averageResponseTime: ((healthStatus.apis.dsld.responseTime || 0) + (healthStatus.apis.imd.responseTime || 0)) / 2,
        globalAccessibility: {
            dsld: healthStatus.apis.dsld.status === 'healthy',
            imd: healthStatus.apis.imd.status === 'healthy' || healthStatus.apis.imd.status === 'unconfigured'
        }
    };
    
    // Set appropriate HTTP status
    let httpStatus = 200;
    if (healthStatus.status === 'degraded') {
        httpStatus = 503;
    } else if (healthStatus.status === 'partial') {
        httpStatus = 207; // Multi-Status
    }
    
    console.log(`🏥 Health check completed - Status: ${healthStatus.status}`);
    
    res.status(httpStatus).json(healthStatus);
}

export const config = {
    regions: ['hnd1', 'iad1', 'sfo1'], // Global coverage
    maxDuration: 15 // Allow time for multiple API checks
}