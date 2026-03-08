/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/03/2026
**/

const fs = require('fs');
const path = require('path');
const logger = require('../../../utils/logger');

const BLOGS_DIR = path.join(__dirname, '../../../data');

const loadAllBlogPosts = () => {
    const posts = [];
    try {
        const files = fs.readdirSync(BLOGS_DIR);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(BLOGS_DIR, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const post = JSON.parse(content);
                posts.push(post);
            }
        }
        posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } catch (error) {
        logger.error(`Error loading blog posts: ${error.message}`);
    }
    return posts;
};

const getAllBlogPosts = async (page = 1, limit = 5) => {
    logger.info(`Fetching blog posts - page: ${page}, limit: ${limit}`);
    const allPosts = loadAllBlogPosts();
    const totalCount = allPosts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = allPosts.slice(startIndex, endIndex).map(post => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        publishedAt: post.publishedAt,
        readingTime: post.readingTime
    }));
    return {
        posts: paginatedPosts,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalPosts: totalCount,
            limit: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

const getBlogPostBySlug = async (slug) => {
    logger.info(`Fetching blog post with slug: ${slug}`);
    const allPosts = loadAllBlogPosts();
    const post = allPosts.find(p => p.slug === slug);
    if (!post) throw new Error(`Blog post with slug "${slug}" not found`);
    return post;
};

const getBlogPostById = async (id) => {
    logger.info(`Fetching blog post with ID: ${id}`);
    const allPosts = loadAllBlogPosts();
    const post = allPosts.find(p => p.id === id);
    if (!post) throw new Error(`Blog post with ID "${id}" not found`);
    return post;
};

module.exports = {
    getAllBlogPosts,
    getBlogPostBySlug,
    getBlogPostById
};