import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HasRoleDirective],
  template: `
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-3" *appHasRole="['admin']">
        <div class="surface-card shadow-2 p-3 border-round cursor-pointer" routerLink="/students">
          <div class="flex justify-content-between mb-3">
            <div>
              <span class="block text-500 font-medium mb-3">Students</span>
              <div class="text-900 font-medium text-xl">Manage Students</div>
            </div>
            <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
              <i class="pi pi-users text-blue-500 text-xl"></i>
            </div>
          </div>
          <span class="text-500">Click to manage students</span>
        </div>
      </div>

      <!-- Add other dashboard cards here -->
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 2rem;
    }
  `]
})
export class DashboardComponent {}
