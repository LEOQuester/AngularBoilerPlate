import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <button (click)="testRefresh()" class="p-2 bg-blue-500 text-white rounded">
        Test Refresh Token
      </button>
      <div class="mt-4">
        <pre>{{ responseLog }}</pre>
      </div>
    </div>
  `
})
export class TestComponent {
  responseLog: string = '';
  private apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  testRefresh(): void {
    console.log('Testing refresh token...');
    this.http.post(`${this.apiBase}core/token/refresh/`, {}, {
      withCredentials: true,
      observe: 'response'
    }).subscribe({
      next: (response) => {
        this.responseLog = JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: {
            'content-type': response.headers.get('content-type')
          },
          body: response.body
        }, null, 2);
        console.log('Refresh response:', this.responseLog);
      },
      error: (error) => {
        this.responseLog = JSON.stringify({
          status: error.status,
          statusText: error.statusText,
          error: error.error
        }, null, 2);
        console.error('Refresh error:', this.responseLog);
      }
    });
  }
}