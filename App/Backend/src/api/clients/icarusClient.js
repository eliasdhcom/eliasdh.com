/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const axios = require('axios');
const { server: config } = require('../../config/env');
const logger = require('../../utils/logger');
const { PassThrough } = require('stream');

class icarusClient {
    constructor(baseUrl = config.eliasdhAPIUrl) {
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 1200000,
            headers: { 'Content-Type': 'application/json' },
            responseType: 'stream'
        });
    }

    async predict(message) {
        try {
            const response = await this.client.post('/api/generate', { model: 'llama3', prompt: message });

            return new Promise((resolve, reject) => {
                let fullText = '';
                let done = false;

                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim());
                    lines.forEach(line => {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.response) fullText += parsed.response;
                            if (parsed.done) done = true;
                        } catch (parseError) {
                            logger.warn(`Failed to parse line: ${line} - Error: ${parseError.message}`);
                        }
                    });
                });

                response.data.on('end', () => {
                    if (done) resolve({ prediction: fullText.trim() });
                    else reject(new Error('Stream ended without "done" signal'));
                });

                response.data.on('error', (error) => {
                    reject(error);
                });

                const timeout = setTimeout(() => {
                    reject(new Error('Stream timeout'));
                }, 60000);

                response.data.on('end', () => clearTimeout(timeout));
                response.data.on('error', () => clearTimeout(timeout));
            });
        } catch (error) {
            logger.error(`IcarusClient predict error: ${error.message}`);
            throw new Error(`AI prediction fails: ${error.response?.data?.error || error.message}`);
        }
    }
}

module.exports = icarusClient;