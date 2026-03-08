/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/03/2026
**/

const express = require('express');
const blogService = require('../../services/blog/blogService');
const logger = require('../../../utils/logger');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        logger.info(`Fetching blog posts - page: ${page}, limit: ${limit}`);
        const result = await blogService.getAllBlogPosts(page, limit);
        res.status(200).json({
            success: true,
            data: result.posts,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error(`Error fetching blog posts: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        logger.info(`Fetching blog post with slug: ${slug}`);
        const post = await blogService.getBlogPostBySlug(slug);
        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        logger.error(`Error fetching blog post: ${error.message}`);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;