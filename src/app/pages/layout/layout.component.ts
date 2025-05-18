import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { AuthService } from '../../services/auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterModule,
    SidebarComponent,
    FooterComponent,
    BreadcrumbComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check verification status on initial load
    this.checkVerificationStatus();

    // Check verification status on each navigation event
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Don't check if we're already on the update-profile page
      if (!this.router.url.includes('/update-profile')) {
        this.checkVerificationStatus();
      }
    });
  }

  private checkVerificationStatus(): void {
    this.authService.checkVerificationStatus().subscribe(status => {
      if (!status.is_verified && !this.router.url.includes('/update-profile')) {
        this.router.navigate(['/update-profile']);
      }
    });
  }
}
