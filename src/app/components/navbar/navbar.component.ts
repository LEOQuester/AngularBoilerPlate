import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  // Define the logo path here
  logoPath: string = "https://99designs-blog.imgix.net/blog/wp-content/uploads/2022/06/Starbucks_Corporation_Logo_2011.svg-e1657703028844.png?auto=format&q=60&fit=max&w=930";
  

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Initialize theme state on component load
  ngOnInit(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      this.isDarkMode = savedMode === 'true';
      this.applyTheme();
    }
    this.loadUser();
  }

  private loadUser(): void {
    const userString = localStorage.getItem(this.authService.getUserStorageKey());
    if (userString) {
      this.currentUser = JSON.parse(userString);
    }
  }

  get userInitial(): string {
    if (!this.currentUser) return '';
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  get userProfile(): string | undefined {
    if (!this.currentUser) return undefined;
    return (this.currentUser as any)?.profile?.image || undefined;
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
