const axios = require('axios');

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

/**
 * reCAPTCHA v3 verification middleware.
 * Expects { recaptchaToken } in req.body.
 * Rejects bots (score < MIN_SCORE). Passes humans through.
 */
const verifyRecaptcha = async (req, res, next) => {
    // Skip verification in test env or if secret not configured
    if (!RECAPTCHA_SECRET || process.env.NODE_ENV === 'test') {
        return next();
    }

    const token = req.body.recaptchaToken;
    if (!token) {
        return res.status(400).json({ message: 'reCAPTCHA token is required.' });
    }

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: RECAPTCHA_SECRET,
                    response: token
                }
            }
        );

        const { success, score, action } = response.data;

        if (!success) {
            console.warn('[reCAPTCHA] Verification failed:', response.data['error-codes']);
            return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
        }

        if (score < MIN_SCORE) {
            console.warn(`[reCAPTCHA] Low score: ${score} (min: ${MIN_SCORE}) — possible bot.`);
            return res.status(400).json({ message: 'Suspicious activity detected. Please try again.' });
        }

        // Attach score to request for optional logging
        req.recaptchaScore = score;
        req.recaptchaAction = action;
        next();
    } catch (err) {
        console.error('[reCAPTCHA] Error verifying token:', err.message);
        // Fail open in case Google API is down (don't block legitimate users)
        next();
    }
};

module.exports = verifyRecaptcha;
