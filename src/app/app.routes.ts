import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { TestComponent } from './pages/test/test.component';
import { AuthGuard } from './services/auth/auth.guard';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "login",
        pathMatch: "full"
    },
    {
        path: "login",
        component: LoginComponent,
        canActivate: [AuthGuard],
        data: { authGuard: 'canActivateLogin' }
    },
    {
        path: "register",
        component: RegisterComponent,
        data: { breadcrumb: 'Register' }
    },
    {
        path: "test",
        component: TestComponent,
        data: { breadcrumb: 'Test' }
    },
    {
        path: "reset-password",
        component: ResetPasswordComponent,
        data: { breadcrumb: 'Reset Password' }
    },
    {
        path: "",
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: "dashboard",
                component: DashboardComponent,
                data: { breadcrumb: 'Dashboard' }
            },
            {
                path: "update-profile",
                loadComponent: () => import('./pages/update-profile/update-profile.component').then(m => m.UpdateProfileComponent),
                data: { breadcrumb: 'Update Profile' }
            }
        ]
    }
];
