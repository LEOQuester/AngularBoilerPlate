import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { RouterModule } from '@angular/router';
import { HasRoleDirective } from '../../directives/has-role.directive';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule,
    ButtonModule,
    RippleModule,
    StyleClassModule,
    AvatarModule,
    RouterModule,
    HasRoleDirective
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  visible: boolean = false;

  navigationItems: NavigationItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Students', icon: 'pi pi-users', route: '/students', roles: ['admin'] }
  ];

  toggleDrawer(): void {
    this.visible = !this.visible;
  }
}