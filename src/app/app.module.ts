import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';

// ...other imports...

@NgModule({
  declarations: [
    // ...components...
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    LoginComponent
  ],
  providers: []
})
  
export class AppModule { }