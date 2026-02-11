/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

const express = require('express');
const clusterService = require('../../services/cluster/clusterService');
const logger = require('../../../utils/logger');
const router = express.Router();

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

module.exports = router;