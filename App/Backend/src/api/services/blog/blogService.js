/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

function mapPost(row, includeContent = false) {
    const post = {
        id:          Number(row.id),
        slug:        row.slug,
        title:       row.title,
        excerpt:     row.excerpt,
        author:      row.author,
        publishedAt: row.published_at,
        readingTime: row.reading_time
    };
    if (includeContent) post.content = JSON.parse(row.content);
    return post;
}

const getAllBlogPosts = async (page = 1, limit = 5) => {
    logger.info(`Fetching blog posts — page: ${page}, limit: ${limit}`);
    const db = getDb();

    const { rows: [{ n }] } = await db.execute('SELECT COUNT(*) AS n FROM blog_posts');
    const totalCount = Number(n);
    const totalPages = Math.ceil(totalCount / limit);
    const offset     = (page - 1) * limit;

    const { rows } = await db.execute({
        sql:  'SELECT id, slug, title, excerpt, author, published_at, reading_time FROM blog_posts ORDER BY published_at DESC LIMIT ? OFFSET ?',
        args: [limit, offset]
    });

    return {
        posts: rows.map(r => mapPost(r)),
        pagination: {
            currentPage: page,
            totalPages,
            totalPosts:  totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

const getBlogPostBySlug = async (slug) => {
    logger.info(`Fetching blog post with slug: ${slug}`);
    const { rows } = await getDb().execute({ sql: 'SELECT * FROM blog_posts WHERE slug = ?', args: [slug] });
    if (!rows.length) throw new Error(`Blog post with slug "${slug}" not found`);
    return mapPost(rows[0], true);
};

const getBlogPostById = async (id) => {
    logger.info(`Fetching blog post with ID: ${id}`);
    const { rows } = await getDb().execute({ sql: 'SELECT * FROM blog_posts WHERE id = ?', args: [id] });
    if (!rows.length) throw new Error(`Blog post with ID "${id}" not found`);
    return mapPost(rows[0], true);
};

module.exports = { getAllBlogPosts, getBlogPostBySlug, getBlogPostById };