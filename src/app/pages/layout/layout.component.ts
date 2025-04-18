import { Component } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-layout',
  imports: [
    DrawerModule,
    ButtonModule,
    AvatarModule,
    DashboardComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  visible: boolean = false; // Initialize the visibility state of the drawer

  toggleDrawer() {
    this.visible = !this.visible; // Toggle the visibility state of the drawer
  }

}
