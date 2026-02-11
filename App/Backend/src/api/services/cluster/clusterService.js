/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

const k8s = require('@kubernetes/client-node');
const logger = require('../../../utils/logger');

class ClusterService {
    constructor() {
        this.kc = new k8s.KubeConfig();
        this.kubeEnabled = false;
        this.initKubeConfig();
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000;
    }

    initKubeConfig() {
        try {
            if (process.env.KUBERNETES_SERVICE_HOST) {
                this.kc.loadFromCluster();
                this.kubeEnabled = true;
                logger.info('Kubernetes in-cluster config loaded - cluster data available');
            } else {
                logger.info('Not in Kubernetes - cluster data unavailable');
                this.kubeEnabled = false;
            }
        } catch (error) {
            logger.warn(`Kubernetes unavailable: ${error.message}`);
            this.kubeEnabled = false;
        }
    }

    getCacheKey(type) {
        return `cluster_${type}`;
    }

    getCachedData(type) {
        const cacheKey = this.getCacheKey(type);
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) return cached.data;

        this.cache.delete(cacheKey);
        return null;
    }

    setCachedData(type, data) {
        const cacheKey = this.getCacheKey(type);
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
    }

    async getClusterNodes() {
        if (!this.kubeEnabled) {
            logger.info('Kubernetes unavailable - returning mock cluster nodes data');
            return this.getMockNodeData();
        }

        try {
            const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
            const nodesResponse = await coreApi.listNode();

            const nodes = nodesResponse.body.items.map(node => {
                const nodeStatus = this.getNodeStatus(node);
                const nodeResources = this.getNodeResources(node);

                return {
                    name: node.metadata.name,
                    status: nodeStatus.status,
                    resources: nodeResources,
                    allocatable: node.status.allocatable,
                    capacity: node.status.capacity,
                    createdAt: node.metadata.creationTimestamp,
                    labels: node.metadata.labels || {}
                };
            });

            const clusterData = {
                totalNodes: nodes.length,
                healthyNodes: nodes.filter(n => n.status === 'Ready').length,
                unhealthyNodes: nodes.filter(n => n.status !== 'Ready').length,
                nodes: nodes,
                timestamp: new Date().toISOString()
            };

            this.setCachedData('nodes', clusterData);

            logger.info(`Retrieved cluster nodes: ${nodes.length} nodes, ${clusterData.healthyNodes} healthy`);
            return clusterData;

        } catch (error) {
            logger.error(`Error retrieving cluster nodes: ${error.message}`);
            throw error;
        }
    }

    async getClusterOverview() {
        if (!this.kubeEnabled) {
            logger.info('Kubernetes unavailable - returning mock cluster overview data');
            return this.getMockOverviewData();
        }

        const cached = this.getCachedData('overview');
        if (cached) {
            logger.info('Returning cached cluster overview data');
            return cached;
        }

        try {
            const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
            const appsApi = this.kc.makeApiClient(k8s.AppsV1Api);

            const nodesResponse = await coreApi.listNode();
            const nodes = nodesResponse.body.items;

            const podsResponse = await coreApi.listPodForAllNamespaces();
            const pods = podsResponse.body.items;

            const deploymentsResponse = await appsApi.listDeploymentForAllNamespaces();
            const deployments = deploymentsResponse.body.items;

            const nodeMetrics = {
                total: nodes.length,
                ready: nodes.filter(n => this.isNodeReady(n)).length,
                notReady: nodes.filter(n => !this.isNodeReady(n)).length,
                memory: this.aggregateNodeMetric(nodes, 'memory'),
                cpu: this.aggregateNodeMetric(nodes, 'cpu')
            };

            const podMetrics = {
                total: pods.length,
                running: pods.filter(p => p.status.phase === 'Running').length,
                pending: pods.filter(p => p.status.phase === 'Pending').length,
                failed: pods.filter(p => p.status.phase === 'Failed').length,
                succeeded: pods.filter(p => p.status.phase === 'Succeeded').length,
                unknown: pods.filter(p => p.status.phase === 'Unknown').length
            };

            const deploymentMetrics = {
                total: deployments.length,
                readyReplicas: deployments.reduce((sum, d) => sum + (d.status.readyReplicas || 0), 0),
                desiredReplicas: deployments.reduce((sum, d) => sum + (d.spec.replicas || 0), 0),
                updatedReplicas: deployments.reduce((sum, d) => sum + (d.status.updatedReplicas || 0), 0)
            };

            const overview = {
                clusterHealth: {
                    status: nodeMetrics.notReady === 0 ? 'Healthy' : 'Degraded',
                    nodesHealthy: nodeMetrics.ready === nodeMetrics.total
                },
                nodes: nodeMetrics,
                pods: podMetrics,
                deployments: deploymentMetrics,
                timestamp: new Date().toISOString()
            };

            this.setCachedData('overview', overview);

            logger.info(`Cluster overview: ${nodeMetrics.total} nodes, ${podMetrics.running} running pods`);
            return overview;

        } catch (error) {
            logger.error(`Error retrieving cluster overview: ${error.message}`);
            throw error;
        }
    }

    async getPodsByNamespace(namespace = null) {
        if (!this.kubeEnabled) {
            logger.info(`Kubernetes unavailable - returning mock pods data${namespace ? ` for namespace: ${namespace}` : ''}`);
            return this.getMockPodsData(namespace);
        }

        const cacheKey = namespace ? `pods_${namespace}` : 'pods_all';
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            logger.info(`Returning cached pods data for namespace: ${namespace || 'all'}`);
            return cached;
        }

        try {
            const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
            let podsResponse;
            if (namespace) podsResponse = await coreApi.listNamespacedPod(namespace);
            else podsResponse = await coreApi.listPodForAllNamespaces();

            const pods = podsResponse.body.items.map(pod => ({
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                status: pod.status.phase,
                containerStatuses: pod.status.containerStatuses?.map(c => ({
                    name: c.name,
                    ready: c.ready,
                    restartCount: c.restartCount,
                    image: c.image,
                    imageID: c.imageID,
                    state: c.state
                })) || [],
                labels: pod.metadata.labels || {},
                createdAt: pod.metadata.creationTimestamp,
                node: pod.spec.nodeName
            }));

            const podsData = {
                namespace: namespace || 'all',
                total: pods.length,
                pods: pods,
                timestamp: new Date().toISOString()
            };

            this.setCachedData(cacheKey, podsData);

            logger.info(`Retrieved ${pods.length} pods from ${namespace || 'all namespaces'}`);
            return podsData;

        } catch (error) {
            logger.error(`Error retrieving pods: ${error.message}`);
            throw error;
        }
    }

    isNodeReady(node) {
        const readyCondition = node.status.conditions?.find(c => c.type === 'Ready');
        return readyCondition?.status === 'True';
    }

    getNodeStatus(node) {
        const readyCondition = node.status.conditions?.find(c => c.type === 'Ready');

        if (readyCondition?.status === 'True') {
            return {
                status: 'Ready',
                reason: readyCondition.reason,
                message: readyCondition.message
            };
        }

        const notReadyCondition = node.status.conditions?.find(
            c => c.status === 'True' && ['NotReady', 'MemoryPressure', 'DiskPressure', 'PIDPressure', 'NetworkUnavailable'].includes(c.type)
        );

        return {
            status: notReadyCondition?.type || 'Unknown',
            reason: notReadyCondition?.reason || 'Unknown',
            message: notReadyCondition?.message || 'Node status unknown'
        };
    }

    getNodeResources(node) {
        const allocatable = node.status.allocatable || {};
        const capacity = node.status.capacity || {};

        return {
            cpuCapacity: capacity.cpu,
            memoryCapacity: capacity.memory,
            cpuAllocatable: allocatable.cpu,
            memoryAllocatable: allocatable.memory,
            podsCapacity: capacity.pods,
            podsAllocatable: allocatable.pods,
            storageCapacity: capacity['ephemeral-storage'],
            storageAllocatable: allocatable['ephemeral-storage']
        };
    }

    aggregateNodeMetric(nodes, metricType) {
        const metricKey = metricType === 'cpu' ? 'cpu' : 'memory';
        let totalCapacity = 0;
        let totalAllocatable = 0;

        nodes.forEach(node => {
            const capacity = node.status.capacity?.[metricKey];
            const allocatable = node.status.allocatable?.[metricKey];

            if (capacity) totalCapacity += this.parseK8sQuantity(capacity);
            if (allocatable) totalAllocatable += this.parseK8sQuantity(allocatable);
        });

        return {
            capacity: totalCapacity,
            allocatable: totalAllocatable
        };
    }

    parseK8sQuantity(quantity) {
        if (!quantity) return 0;

        quantity = String(quantity);

        if (quantity.endsWith('m')) return parseInt(quantity) / 1000;
        if (quantity.endsWith('Ki')) return parseInt(quantity) * 1024;
        if (quantity.endsWith('Mi')) return parseInt(quantity) * 1024 * 1024;
        if (quantity.endsWith('Gi')) return parseInt(quantity) * 1024 * 1024 * 1024;

        return parseInt(quantity) || 0;
    }

    getMockNodeData() {
        const mockNodes = [
            {
                name: 'master-1',
                status: 'Ready',
                resources: {
                    cpuCapacity: '8',
                    memoryCapacity: '32Gi',
                    cpuAllocatable: '7500m',
                    memoryAllocatable: '28Gi',
                    podsCapacity: '110',
                    podsAllocatable: '110'
                },
                allocatable: {
                    cpu: '7500m',
                    memory: '28Gi',
                    pods: '110'
                },
                capacity: {
                    cpu: '8',
                    memory: '32Gi',
                    pods: '110'
                },
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                labels: { 'node-role.kubernetes.io/control-plane': '' }
            },
            {
                name: 'worker-1',
                status: 'Ready',
                resources: {
                    cpuCapacity: '16',
                    memoryCapacity: '64Gi',
                    cpuAllocatable: '15500m',
                    memoryAllocatable: '59Gi',
                    podsCapacity: '110',
                    podsAllocatable: '110'
                },
                allocatable: {
                    cpu: '15500m',
                    memory: '59Gi',
                    pods: '110'
                },
                capacity: {
                    cpu: '16',
                    memory: '64Gi',
                    pods: '110'
                },
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                labels: { 'node-role.kubernetes.io/worker': '' }
            },
            {
                name: 'worker-2',
                status: 'Ready',
                resources: {
                    cpuCapacity: '16',
                    memoryCapacity: '64Gi',
                    cpuAllocatable: '15200m',
                    memoryAllocatable: '57Gi',
                    podsCapacity: '110',
                    podsAllocatable: '110'
                },
                allocatable: {
                    cpu: '15200m',
                    memory: '57Gi',
                    pods: '110'
                },
                capacity: {
                    cpu: '16',
                    memory: '64Gi',
                    pods: '110'
                },
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                labels: { 'node-role.kubernetes.io/worker': '' }
            }
        ];

        return {
            totalNodes: mockNodes.length,
            healthyNodes: mockNodes.filter(n => n.status === 'Ready').length,
            unhealthyNodes: mockNodes.filter(n => n.status !== 'Ready').length,
            nodes: mockNodes,
            timestamp: new Date().toISOString()
        };
    }

    getMockOverviewData() {
        return {
            clusterHealth: {
                status: 'Healthy',
                nodesHealthy: true
            },
            nodes: {
                total: 3,
                ready: 3,
                notReady: 0,
                memory: {
                    capacity: 160,
                    allocatable: 144
                },
                cpu: {
                    capacity: 40,
                    allocatable: 38.2
                }
            },
            pods: {
                total: 85,
                running: 81,
                pending: 2,
                failed: 1,
                succeeded: 1,
                unknown: 0
            },
            deployments: {
                total: 12,
                readyReplicas: 36,
                desiredReplicas: 36,
                updatedReplicas: 36
            },
            timestamp: new Date().toISOString()
        };
    }

    getMockPodsData(namespace = null) {
        const mockPods = [
            {
                name: 'nginx-deployment-66b6c48dd5-2xhkp',
                namespace: 'default',
                status: 'Running',
                containerStatuses: [
                    {
                        name: 'nginx',
                        ready: true,
                        restartCount: 0,
                        image: 'nginx:1.25',
                        imageID: 'docker.io/library/nginx@sha256:xyz',
                        state: { running: { startedAt: new Date().toISOString() } }
                    }
                ],
                labels: { app: 'nginx', version: 'v1' },
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                node: 'worker-1'
            },
            {
                name: 'postgresql-0',
                namespace: 'database',
                status: 'Running',
                containerStatuses: [
                    {
                        name: 'postgresql',
                        ready: true,
                        restartCount: 0,
                        image: 'postgresql:15',
                        imageID: 'docker.io/library/postgresql@sha256:abc',
                        state: { running: { startedAt: new Date().toISOString() } }
                    }
                ],
                labels: { app: 'postgresql', tier: 'database' },
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                node: 'worker-2'
            },
            {
                name: 'redis-cache-5df7c4d8f-xzq9p',
                namespace: 'cache',
                status: 'Running',
                containerStatuses: [
                    {
                        name: 'redis',
                        ready: true,
                        restartCount: 0,
                        image: 'redis:7-alpine',
                        imageID: 'docker.io/library/redis@sha256:def',
                        state: { running: { startedAt: new Date().toISOString() } }
                    }
                ],
                labels: { app: 'redis', cache: 'true' },
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                node: 'worker-1'
            },
            {
                name: 'api-service-8b9c7a4e2-q8kvm',
                namespace: 'production',
                status: 'Running',
                containerStatuses: [
                    {
                        name: 'api',
                        ready: true,
                        restartCount: 2,
                        image: 'myapi:v2.1.0',
                        imageID: 'gcr.io/myproject/api@sha256:ghi',
                        state: { running: { startedAt: new Date().toISOString() } }
                    }
                ],
                labels: { app: 'api', env: 'prod' },
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                node: 'worker-2'
            }
        ];

        const filteredPods = namespace 
            ? mockPods.filter(p => p.namespace === namespace)
            : mockPods;

        return {
            namespace: namespace || 'all',
            total: filteredPods.length,
            pods: filteredPods,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new ClusterService();