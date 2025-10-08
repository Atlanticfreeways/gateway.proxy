// Email Service - Verification and notifications
class EmailService {
    constructor() {
        this.apiKey = 'your-email-service-api-key';
        this.baseURL = 'https://api.emailjs.com/api/v1.0/email/send';
        this.templates = {
            verification: 'template_verification',
            passwordReset: 'template_password_reset',
            welcome: 'template_welcome'
        };
    }

    // Generate verification token
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Store verification token
    storeVerificationToken(email, token) {
        const tokens = JSON.parse(localStorage.getItem('verificationTokens') || '{}');
        tokens[email] = {
            token,
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            verified: false
        };
        localStorage.setItem('verificationTokens', JSON.stringify(tokens));
    }

    // Verify token
    verifyToken(email, token) {
        const tokens = JSON.parse(localStorage.getItem('verificationTokens') || '{}');
        const stored = tokens[email];
        
        if (!stored || stored.token !== token || stored.expires < Date.now()) {
            return false;
        }
        
        stored.verified = true;
        localStorage.setItem('verificationTokens', JSON.stringify(tokens));
        return true;
    }

    // Send verification email
    async sendVerificationEmail(email, username) {
        const token = this.generateToken();
        this.storeVerificationToken(email, token);
        
        const verificationLink = `${window.location.origin}/verify?email=${encodeURIComponent(email)}&token=${token}`;
        
        const emailData = {
            service_id: 'your_service_id',
            template_id: this.templates.verification,
            user_id: 'your_user_id',
            template_params: {
                to_email: email,
                username: username,
                verification_link: verificationLink,
                company_name: 'Gateways Proxy'
            }
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });
            
            if (response.ok) {
                console.log('Verification email sent successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to send verification email:', error);
        }
        return false;
    }

    // Send password reset email
    async sendPasswordResetEmail(email) {
        const token = this.generateToken();
        this.storeVerificationToken(email, token);
        
        const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
        
        const emailData = {
            service_id: 'your_service_id',
            template_id: this.templates.passwordReset,
            user_id: 'your_user_id',
            template_params: {
                to_email: email,
                reset_link: resetLink,
                company_name: 'Gateways Proxy'
            }
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return false;
        }
    }

    // Check if email is verified
    isEmailVerified(email) {
        const tokens = JSON.parse(localStorage.getItem('verificationTokens') || '{}');
        return tokens[email]?.verified || false;
    }
}

// Initialize email service
const emailService = new EmailService();
window.EmailService = emailService;