/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express     = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../../services/auth/authService');

const router = express.Router();

router.post('/login',
    body('email').isEmail().trim(),
    body('password').notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: 'Ongeldige invoer.' });
            }

            const result = await authService.login(req.body.email, req.body.password);
            if (!result) {
                return res.status(401).json({ success: false, error: 'Ongeldig e-mailadres of wachtwoord.' });
            }
            if (result.blocked) {
                return res.status(403).json({ success: false, error: 'Uw account is gedeactiveerd. Neem contact op met de beheerder.' });
            }

            res.json({ success: true, token: result.token, data: result.user });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
