/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VaultService {
    private token: string | null = null;
    private expiresAt = 0;
    private timer: ReturnType<typeof setTimeout> | null = null;

    private readonly _unlocked$ = new BehaviorSubject<boolean>(false);
    readonly unlocked$: Observable<boolean> = this._unlocked$.asObservable();

    unlock(token: string, expiresAt: number): void {
        this.token     = token;
        this.expiresAt = expiresAt;
        this._unlocked$.next(true);
        this.scheduleAutoLock();
    }

    lock(): void {
        this.token     = null;
        this.expiresAt = 0;
        if (this.timer) clearTimeout(this.timer);
        this._unlocked$.next(false);
    }

    getToken(): string | null {
        return (this.token && Date.now() < this.expiresAt) ? this.token : null;
    }

    get isUnlocked(): boolean {
        return this.getToken() !== null;
    }

    get remainingMs(): number {
        return Math.max(0, this.expiresAt - Date.now());
    }

    private scheduleAutoLock(): void {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.lock(), this.remainingMs);
    }
}
