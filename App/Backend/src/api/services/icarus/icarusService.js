/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const IcarusClient = require('../../clients/icarusClient');
const icarusClient = new IcarusClient();
const logger = require('../../../utils/logger');

class IcarusService {
    async generateReply(message) {
        try {
        const aiInput = { message: `User: ${message}` };

        const aiResponse = await icarusClient.predict(aiInput.message);

        return {
            reply: aiResponse.prediction || 'No response received from AI.'
        };
        } catch (error) {
            logger.error(`IcarusService generateReply error: ${error.message}`);
            throw new Error(`Error generating reply: ${error.message}`);
        }
    }
}

module.exports = new IcarusService();