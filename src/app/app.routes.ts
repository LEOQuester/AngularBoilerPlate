import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { TestComponent } from './pages/test/test.component';
import { AuthGuard } from './services/auth/auth.guard';

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
        path: "test",
        component: TestComponent
    },
    {
        path: "reset-password",
        component: ResetPasswordComponent
    },
    {
        path: "",
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: "dashboard",
                component: DashboardComponent
            },
            {
                path: "update-profile",
                loadChildren: () => import('./pages/update-profile/update-profile.routes').then(m => m.UPDATE_PROFILE_ROUTES)
            }
        ]
    }
];
