import { Routes } from '@angular/router';
import { Leaderboard } from './leaderboard/leaderboard';
import { Admin } from './admin/admin';
import { SeasonsAdmin } from './seasons-admin/seasons-admin';
import { ClientAdmin } from './client-admin/client-admin';
import { DriverAdmin } from './driver-admin/driver-admin';

export const routes: Routes = [
  { path: '', component: Leaderboard },
  { path: 'admin-f1-secreto-2026', component: Admin },
  { path: 'admin/season', component: SeasonsAdmin },
  { path: 'admin/client', component: ClientAdmin },
  { path: 'admin/driver', component: DriverAdmin }
];
