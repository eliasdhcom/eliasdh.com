/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/12/2025
**/

const k8s = require('@kubernetes/client-node');
const logger = require('../../../utils/logger');

class MetricsService {
    constructor() {
        this.kc = new k8s.KubeConfig();
        this.kubeEnabled = false;
        this.initKubeConfig();
        this.cache = new Map();
        this.cacheTTL = 1 * 60 * 1000; // 1 minutes
    }

    initKubeConfig() {
        try {
            if (process.env.KUBERNETES_SERVICE_HOST) {
                this.kc.loadFromCluster();
                this.kubeEnabled = true;
                logger.info('Kubernetes in-cluster config loaded - metrics will use real data');
            } else {
                logger.info('Not in Kubernetes - metrics will use mock data');
                this.kubeEnabled = false;
            }
        } catch (error) {
            logger.warn(`Kubernetes unavailable: ${error.message}`);
            this.kubeEnabled = false;
        }
    }

    async getVisitorCountFromLogs(domain) {
        if (!this.kubeEnabled) throw new Error('Kubernetes API not available');

        try {
            const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);

            const namespace = process.env.INGRESS_NAMESPACE || 'ingress-nginx';
            const labelSelector = 'app.kubernetes.io/name=ingress-nginx';

            const podsResponse = await coreApi.listNamespacedPod(
                namespace,
                undefined,
                undefined,
                undefined,
                undefined,
                labelSelector
            );

            if (podsResponse.body.items.length === 0) throw new Error(`No ingress pods found in ${namespace}`);

            let totalCount = 0;

            const baseDomain = domain.replace(/^www\./, '');
            const isRootDomain = baseDomain.split('.').length === 2;
            const domainsToCheck = [baseDomain];
            
            if (isRootDomain) {
                domainsToCheck.push(`www.${baseDomain}`);
            }

            for (const pod of podsResponse.body.items) {
                try {
                    const logs = await coreApi.readNamespacedPodLog(
                        pod.metadata.name,
                        namespace,
                        undefined,
                        false,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined // No time limit - get all available logs
                    );

                    const lines = logs.body.split('\n');
                    for (const line of lines) {
                        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(line)) continue;

                        if (line.includes('/api/v1/metrics/')) continue;

                        for (const domainToCheck of domainsToCheck) {
                            if (line.includes(` ${domainToCheck} `) || 
                                line.includes(`"${domainToCheck}"`) ||
                                line.includes(`/${domainToCheck}/`)) {
                                totalCount++;
                                break;
                            }
                        }
                    }
                } catch (logError) {
                    logger.warn(`Failed to read logs from ${pod.metadata.name}: ${logError.message}`);
                }
            }

            const wwwInfo = isRootDomain ? ' (including www)' : '';
            logger.info(`Got ${totalCount} visitors for ${domain}${wwwInfo} from ingress logs`);
            return totalCount;
        } catch (error) {
            logger.error(`Error reading ingress logs: ${error.message}`);
            throw error;
        }
    }

    async getVisitorCount(domain) {
        try {
            if (!domain || typeof domain !== 'string') {
                throw new Error('Invalid domain');
            }

            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

            const cached = this.cache.get(cleanDomain);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                logger.info(`Cache hit for ${cleanDomain}: ${cached.count}`);
                return cached.count;
            }

            let count = 0;

            if (this.kubeEnabled) {
                try {
                    count = await this.getVisitorCountFromLogs(cleanDomain);
                } catch (error) {
                    logger.error(`Kubernetes error: ${error.message} - returning 0`);
                }
            } else {
                logger.warn(`Kubernetes not available - returning 0 for ${cleanDomain}`);
                count = 0;
            }

            this.cache.set(cleanDomain, {
                count,
                timestamp: Date.now()
            });

            return count;
        } catch (error) {
            logger.error(`getVisitorCount error: ${error.message}`);
            throw error;
        }
    }

    async getVisitorCountsForDomains(domains) {
        try {
            const results = {};

            for (const domain of domains) {
                try {
                    results[domain] = await this.getVisitorCount(domain);
                } catch (error) {
                    logger.error(`Failed for ${domain}: ${error.message}`);
                    results[domain] = 0;
                }
            }

            return results;
        } catch (error) {
            logger.error(`getVisitorCountsForDomains error: ${error.message}`);
            throw error;
        }
    }

    clearCache(domain = null) {
        if (domain) {
            const cleanDomain = domain
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .toLowerCase();
            this.cache.delete(cleanDomain);
            logger.info(`Cache cleared for ${cleanDomain}`);
        } else {
            this.cache.clear();
            logger.info('All cache cleared');
        }
    }
}

module.exports = new MetricsService();