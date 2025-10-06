// Production OAuth Configuration
// Replace with your actual Google Client ID from Google Cloud Console

const OAUTH_CONFIG = {
    // REPLACE THIS WITH YOUR REAL GOOGLE CLIENT ID
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
    
    // OAuth Settings
    OAUTH_SETTINGS: {
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
    },
    
    // Button Configuration
    BUTTON_CONFIG: {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
    },
    
    // Authorized Domains (Update for production)
    AUTHORIZED_DOMAINS: [
        'localhost',
        'gateways.com',
        'www.gateways.com'
    ],
    
    // Required Scopes
    SCOPES: [
        'email',
        'profile',
        'openid'
    ]
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OAUTH_CONFIG;
}