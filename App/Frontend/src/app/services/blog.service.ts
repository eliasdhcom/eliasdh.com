/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/03/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface BlogPostSummary {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    publishedAt: string;
}

export interface ContentBlock {
    type: 'paragraph' | 'heading' | 'list' | 'quote' | 'code';
    text?: string;
    level?: number;
    style?: 'bullet' | 'numbered';
    items?: string[];
    author?: string;
    language?: string;
}

export interface BlogPost extends BlogPostSummary {
    content: ContentBlock[];
    readingTime?: number;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface BlogPostsResponse {
    success: boolean;
    data: BlogPostSummary[];
    pagination: PaginationInfo;
}

export interface BlogPostResponse {
    success: boolean;
    data: BlogPost;
}

@Injectable({
    providedIn: 'root'
})

export class BlogService {
    private apiUrl = `${environment.eliasdhApiUrl}/api/v1/blog`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'x-api-key': environment.eliasdhApiKey
        });
    }

    getAllPosts(page: number = 1, limit: number = 5): Observable<BlogPostsResponse> {
        const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

        return this.http.get<BlogPostsResponse>(this.apiUrl, { 
            headers: this.getHeaders(),
            params
        });
    }

    getPostBySlug(slug: string): Observable<BlogPostResponse> {
        return this.http.get<BlogPostResponse>(`${this.apiUrl}/${slug}`, { 
            headers: this.getHeaders() 
        });
    }
}