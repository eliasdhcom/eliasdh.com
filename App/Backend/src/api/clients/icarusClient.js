/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const axios = require('axios');
const { server: config } = require('../../config/env');
const logger = require('../../utils/logger');

class icarusClient {
    constructor(baseUrl = config.eliasdhAPIUrl) {
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async predict(message) {
        try {
            // const response = await this.client.post('/predict', { message });
            // return response.data;

            return { prediction: "I'm sorry, currently not up for the challenge." };
        } catch (error) {
            logger.error(`IcarusClient predict error: ${error.message}`);
            throw new Error(`AI prediction fails: ${error.response?.data?.error || error.message}`);
        }
    }
}

module.exports = icarusClient;