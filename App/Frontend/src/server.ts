/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './main.server';

const engineCache = new Map<string, CommonEngine>();

function getEngine(hostname: string): CommonEngine {
    if (!engineCache.has(hostname)) {
        engineCache.set(hostname, new CommonEngine({ allowedHosts: [hostname] }));
    }
    return engineCache.get(hostname)!;
}

export function app(): express.Express {
    const server = express();
    const serverDistFolder = dirname(fileURLToPath(import.meta.url));
    const browserDistFolder = resolve(serverDistFolder, '../browser');
    const indexHtml = join(serverDistFolder, 'index.server.html');

    server.set('view engine', 'html');
    server.set('views', browserDistFolder);

    server.use('/assets/includes/', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Cache-Control', 'public, max-age=86400');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        return next();
    });

    server.get('**', express.static(browserDistFolder, {
        maxAge: '1y',
        index: false,
    }));

    server.get('**', (req, res, next) => {
        const { protocol, originalUrl, baseUrl, headers } = req;
        const hostname = req.hostname;
        getEngine(hostname)
            .render({
                bootstrap,
                documentFilePath: indexHtml,
                url: `${protocol}://${headers.host}${originalUrl}`,
                publicPath: browserDistFolder,
                providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
            })
            .then((html) => res.send(html))
            .catch((err) => next(err));
    });

    return server;
}

function run(): void {
    const port = process.env['PORT'] || 4000;
    const server = app();
    server.listen(port, () => {
        console.log(`Node Express server listening on http://localhost:${port}`);
    });
}

run();