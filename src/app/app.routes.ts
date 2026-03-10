import { Routes } from '@angular/router';
import { Leaderboard } from './leaderboard/leaderboard';
import { Admin } from './admin/admin';

export const routes: Routes = [
  { path: '', component: Leaderboard },
  { path: 'admin-f1-secreto-2026', component: Admin }
];
