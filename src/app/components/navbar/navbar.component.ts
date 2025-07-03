import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { RouterModule, Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../models/auth/auth.interface';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DrawerModule,
    RouterModule,
    AvatarModule,
    AvatarGroupModule,
    TooltipModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  // Define the logo path here
  logoPath: string = "/joshepvaslogo.png";
  
  //customise this section to add more menu items
  // maximum 4 items are allowed in the navbar
  menuItems = [
    { label: 'Home', link: '/dashboard', icon: 'pi pi-home' },
    { label: 'About', link: '/about', icon: 'pi pi-info-circle' },
    { label: 'Docs', link: '/docs', icon: 'pi pi-question-circle' },
    { label: 'Contact', link: '/contact', icon: 'pi pi-phone' }
  ];

  isDarkMode: boolean = false;
  isDrawerOpen: boolean = false;
  currentUser: User | null = null;
  avatarLoadError: boolean = false;
  private _userProfile: string | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      this.isDarkMode = savedMode === 'true';
      this.applyTheme();
    }
    
    // Initial load
    this.loadUser();
    
    // Subscribe to auth state changes
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.updateUserProfile();
      this.avatarLoadError = false;
      this.cdr.markForCheck();
    });
  }

  private updateUserProfile(): void {
    if (!this.currentUser?.profile_pic || this.avatarLoadError) {
      this._userProfile = "/profile.jpg"; // Fallback profile picture
    } else {
      const url = new URL(this.currentUser.profile_pic);
      url.protocol = 'https:';
      this._userProfile = url.toString();
    }
  }

  private loadUser(): void {
    const userString = localStorage.getItem(this.authService.getUserStorageKey());
    console.log('NavbarComponent loadUser - raw localStorage value:', this.authService.getUserStorageKey(), userString);
    if (userString) {
      this.currentUser = JSON.parse(userString);
      console.log('NavbarComponent loadUser - parsed user object:', this.currentUser);
      console.log('NavbarComponent loadUser - profile_pic value:', this.currentUser?.profile_pic);
    }
  }

  get userInitial(): string {
    if (!this.currentUser?.name) return '';
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  get userProfile(): string | undefined {
    return this._userProfile;
  }

  handleAvatarError(event: any): void {
    this.avatarLoadError = true;
    this._userProfile = undefined;
    this.cdr.markForCheck();
  }

  // Check if user is not logged in
  get isUserNotLoggedIn(): boolean {
    return !localStorage.getItem(this.authService.getUserStorageKey());
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  // Toggle dark mode
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  // Apply the theme based on the state
  private applyTheme(): void {
    const element : any = document.querySelector('html');
    if (this.isDarkMode) {
      element.classList.add('my-app-dark');
    } else {
      element.classList.remove('my-app-dark');
    }
  }

  onDrawerHide(): void {
    this.isDrawerOpen = false;
  }
  
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  navigateToProfile(): void {
    this.router.navigate(['/update-profile']);
    if (this.isDrawerOpen) {
      this.isDrawerOpen = false;
    }
  }
}
