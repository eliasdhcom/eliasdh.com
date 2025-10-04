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

@Component({
    selector: 'app-chatbot',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})

export class ChatComponent {
    isOpen = false;
    messages: { sender: string; text: string }[] = [];
    userInput = '';

    constructor(private http: HttpClient) {}

    toggleChat() {
        this.isOpen = !this.isOpen;
    }

    async sendMessage() {
        if (!this.userInput.trim()) return;

        const userMessage = this.userInput;
        this.messages.push({ sender: 'user', text: userMessage });
        this.userInput = '';

        try {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'x-api-key': environment.apiKey,
            });

            const res: any = await this.http.post(`${environment.apiUrl}/api/v1/icarus`, { message: userMessage }, { headers }).toPromise();
            this.messages.push({ sender: 'bot', text: res.data.reply });
        } catch (err: any) {
            console.error('Chat API error:', err);
            const errorMessage = err.error?.error || 'An error occurred. Please try again later.';
            this.messages.push({ sender: 'bot', text: `Error: ${err.status} - ${errorMessage}` });
        }
    }
}