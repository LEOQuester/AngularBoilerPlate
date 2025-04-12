import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DrawerModule,
    RouterModule,
    AvatarModule,
    AvatarGroupModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  // Define the logo path here
  logoPath: string = "https://99designs-blog.imgix.net/blog/wp-content/uploads/2022/06/Starbucks_Corporation_Logo_2011.svg-e1657703028844.png?auto=format&q=60&fit=max&w=930";
  

  //customise this section to add more menu items
  // Add more menu items as needed
  menuItems = [
    { label: 'Home', link: '/home', icon: 'pi pi-home' },
    { label: 'About', link: '/about', icon: 'pi pi-info-circle' },
    { label: 'Docs', link: '/docs', icon: 'pi pi-question-circle' },
    { label: 'Contact', link: '/contact', icon: 'pi pi-phone' }
  ];

  isDarkMode: boolean = false;
  isDrawerOpen: boolean = false;

  // Initialize theme state on component load
  ngOnInit(): void {
    const savedMode = localStorage.getItem('darkMode');
    console.log('Saved dark mode state:', savedMode); // Debugging line to check the saved state
    if (savedMode) {
      this.isDarkMode = savedMode === 'true'; // Convert the string value from localStorage to a boolean
      this.applyTheme();  // Apply the theme based on the stored state
    }
  }

  // Toggle dark mode
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('darkMode', this.isDarkMode.toString()); // Save the state to localStorage
    console.log(localStorage.getItem('darkMode')) 
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
}
