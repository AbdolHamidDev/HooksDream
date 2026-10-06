const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

class GoogleAuthService {
    constructor() {
        // Validate GOOGLE_CLIENT_ID
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('❌ GOOGLE_CLIENT_ID environment variable is not set!');
            throw new Error('GOOGLE_CLIENT_ID is required');
        }
        
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        // Validate JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET environment variable is not set!');
            throw new Error('JWT_SECRET is required');
        }
        
        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtExpiry = process.env.JWT_EXPIRY || '7d';
        
        console.log('✅ Google Auth Service initialized');
    }

    /**
     * Decode payload WITHOUT verifying — chỉ để chẩn đoán nguyên nhân thật.
     * verifyIdToken() ném lỗi chung chung nên không biết sai ở đâu.
     */
    decodePayloadUnsafe(idToken) {
        try {
            const parts = String(idToken).split('.');
            if (parts.length !== 3) return null;
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        } catch (error) {
            return null;
        }
    }

    /**
     * Verify Google ID token and extract user info
     * @param {string} idToken - Google ID token from frontend
     * @returns {Object} User information from Google
     */
    async verifyGoogleToken(idToken) {
        const expectedAudience = process.env.GOOGLE_CLIENT_ID;
        const decoded = this.decodePayloadUnsafe(idToken);

        // 1) Lệch audience — nguyên nhân phổ biến nhất khi Vercel/Render đặt
        //    GOOGLE_CLIENT_ID khác nhau. Báo đúng sai số để không phải đoán.
        if (decoded && expectedAudience) {
            const tokenAud = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud;
            if (tokenAud && tokenAud !== expectedAudience) {
                console.error(
                    `❌ GOOGLE_CLIENT_ID LECH AUDIENCE.\n` +
                    `   Token frontend : ${tokenAud}\n` +
                    `   SERVER (Render) : ${expectedAudience}\n` +
                    `   -> Đặt Render GOOGLE_CLIENT_ID = "${tokenAud}"`
                );
                throw new Error(
                    `GOOGLE_CLIENT_ID không khớp: token được tạo bởi "${tokenAud}" nhưng server đang dùng "${expectedAudience}". ` +
                    `Hãy đặt GOOGLE_CLIENT_ID của Render = "${tokenAud}".`
                );
            }

            // 2) Token hết hạn
            if (decoded.exp && Number(decoded.exp) * 1000 < Date.now()) {
                throw new Error('Google ID token đã hết hạn. Vui lòng thử đăng nhập lại.');
            }
        }

        try {
            const ticket = await this.client.verifyIdToken({
                idToken: idToken,
                audience: expectedAudience,
            });

            const payload = ticket.getPayload();
            
            return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                emailVerified: payload.email_verified,
                givenName: payload.given_name,
                familyName: payload.family_name
            };
        } catch (error) {
            console.error('❌ verifyIdToken failed:', error.message, '| decoded aud:', decoded?.aud);
            // Không nuốt lý do thật, nếu không client chỉ thấy "Invalid Google token"
            throw new Error(
                `Không xác thực được Google token: ${error.message}. ` +
                `Kiểm tra GOOGLE_CLIENT_ID trên server và Authorized JavaScript origins ở Google Cloud Console.`
            );
        }
    }

    /**
     * Generate JWT token for authenticated user
     * @param {Object} user - User object from database
     * @returns {string} JWT token
     */
    generateJWTToken(user) {
        const payload = {
            userId: user._id,
            googleId: user.googleId,
            email: user.email,
            username: user.username
        };

        return jwt.sign(payload, this.jwtSecret, { 
            expiresIn: this.jwtExpiry,
            issuer: 'hooksdream-app'
        });
    }

    /**
     * Verify JWT token and extract user info
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    verifyJWTToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header value
     * @returns {string|null} Token or null if not found
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) return null;
        
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        return authHeader;
    }

    /**
     * Generate refresh token (optional for future use)
     * @param {Object} user - User object
     * @returns {string} Refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user._id,
            type: 'refresh'
        };

        return jwt.sign(payload, this.jwtSecret, { 
            expiresIn: '30d',
            issuer: 'hooksdream-app'
        });
    }
}

module.exports = new GoogleAuthService();
