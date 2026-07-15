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

    async countIngressLogMatches(domain, sinceSeconds) {
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
                        sinceSeconds // undefined = no time limit, get all available logs
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
            logger.info(`Got ${totalCount} requests for ${domain}${wwwInfo} from ingress logs`);
            return totalCount;
        } catch (error) {
            logger.error(`Error reading ingress logs: ${error.message}`);
            throw error;
        }
    }

    /** Windowed request count for the traffic sampler - counts only log lines from the last `sinceSeconds`. */
    async getRequestCountSince(domain, sinceSeconds) {
        if (!this.kubeEnabled) return 0;
        try {
            return await this.countIngressLogMatches(this.cleanDomain(domain), sinceSeconds);
        } catch (error) {
            logger.error(`getRequestCountSince error for ${domain}: ${error.message}`);
            return 0;
        }
    }

    cleanDomain(domain) {
        return domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }
}

module.exports = new MetricsService();
