/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})

export class ChatComponent {
    isOpen = false;
    messages: { sender: string; text: string }[] = [];
    userInput = '';
    isLoading = false;

    constructor(private http: HttpClient) {}

    toggleChat() {
        this.isOpen = !this.isOpen;
    }

    async sendMessage() {
        if (!this.userInput.trim()) return;

        const msg = this.userInput;
        this.messages.push({ sender: 'user', text: msg });
        this.userInput = '';
        this.isLoading = true;

        try {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'x-api-key': environment.eliasdhApiKey,
            });

            const res: any = await firstValueFrom(
                this.http.post(`${environment.eliasdhApiUrl}/api/v1/icarus`, { message: msg }, { headers })
            );

            const reply = res?.data?.reply || 'No reply from AI';
            this.messages.push({ sender: 'bot', text: reply });
            } catch (err: any) {
                this.messages.push({ sender: 'bot', text: 'Error: Could not reach API' });
            } finally {
                this.isLoading = false;
        }
    }
}