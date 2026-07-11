/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

const express = require('express');
const clusterService = require('../../services/cluster/clusterService');
const logger = require('../../../utils/logger');
const router = express.Router();

const isValidNamespace = ns => /^[a-z0-9][a-z0-9-]*$/.test(ns) && ns.length <= 63;
const isValidPodName   = pod => /^[a-z0-9][a-z0-9.-]*$/.test(pod) && pod.length <= 253;

router.get('/overview', async (req, res) => {
    try {
        logger.info('Fetching cluster overview');
        const overview = await clusterService.getClusterOverview();
        
        res.status(200).json({
            success: true,
            data: overview
        });
    } catch (error) {
        logger.error(`Cluster overview error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve cluster overview'
        });
    }
});

router.get('/nodes', async (req, res) => {
    try {
        logger.info('Fetching cluster nodes');
        const nodes = await clusterService.getClusterNodes();
        
        res.status(200).json({
            success: true,
            data: nodes
        });
    } catch (error) {
        logger.error(`Cluster nodes error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve cluster nodes'
        });
    }
});

router.get('/pods', async (req, res) => {
    try {
        const { namespace } = req.query;
        
        logger.info(`Fetching pods${namespace ? ` from namespace: ${namespace}` : ''}`);
        const pods = await clusterService.getPodsByNamespace(namespace);
        
        res.status(200).json({
            success: true,
            data: pods
        });
    } catch (error) {
        logger.error(`Cluster pods error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve pods'
        });
    }
});

router.get('/health', async (req, res) => {
    try {
        logger.info('Fetching cluster health summary');
        const overview = await clusterService.getClusterOverview();

        res.status(200).json({
            success: true,
            data: {
                healthy: overview.clusterHealth.nodesHealthy,
                status: overview.clusterHealth.status,
                nodesReady: overview.nodes.ready,
                nodesTotal: overview.nodes.total,
                timestamp: overview.timestamp
            }
        });
    } catch (error) {
        logger.error(`Cluster health error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve cluster health'
        });
    }
});

router.get('/status', async (req, res) => {
    try {
        logger.info('Fetching full cluster status');
        
        const [overview, nodes] = await Promise.all([
            clusterService.getClusterOverview(),
            clusterService.getClusterNodes()
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                overview,
                nodes,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error(`Cluster status error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve cluster status'
        });
    }
});

router.get('/namespace/:namespace/pods', async (req, res) => {
    try {
        const { namespace } = req.params;
        if (!isValidNamespace(namespace)) return res.status(400).json({ success: false, error: 'Invalid namespace name' });

        logger.info(`Fetching pods for namespace: ${namespace}`);
        const data = clusterService.kubeEnabled
            ? await clusterService.getPodsByNamespace(namespace)
            : clusterService.getMockNamespacePods(namespace);

        res.status(200).json({ success: true, data });
    } catch (error) {
        logger.error(`Namespace pods error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message || 'Failed to retrieve namespace pods' });
    }
});

router.get('/namespace/:namespace/stats', async (req, res) => {
    try {
        const { namespace } = req.params;
        if (!isValidNamespace(namespace)) return res.status(400).json({ success: false, error: 'Invalid namespace name' });

        logger.info(`Fetching stats for namespace: ${namespace}`);
        const data = await clusterService.getNamespaceStats(namespace);

        res.status(200).json({ success: true, data });
    } catch (error) {
        logger.error(`Namespace stats error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message || 'Failed to retrieve namespace stats' });
    }
});

router.get('/namespace/:namespace/pods/:pod/logs', async (req, res) => {
    try {
        const { namespace, pod } = req.params;
        const { container } = req.query;
        const tailLines = Math.min(1000, Math.max(1, parseInt(req.query.lines) || 200));

        if (!isValidNamespace(namespace)) return res.status(400).json({ success: false, error: 'Invalid namespace name' });
        if (!isValidPodName(pod))         return res.status(400).json({ success: false, error: 'Invalid pod name' });

        logger.info(`Fetching logs for pod: ${pod} in namespace: ${namespace}`);
        const data = await clusterService.getPodLogs(namespace, pod, container || null, tailLines);

        res.status(200).json({ success: true, data });
    } catch (error) {
        logger.error(`Pod logs error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message || 'Failed to retrieve pod logs' });
    }
});

module.exports = router;