import { Routes } from '@angular/router';
import { Leaderboard } from './leaderboard/leaderboard';
import { Admin } from './admin/admin';
import { SeasonsAdmin } from './seasons-admin/seasons-admin';
import { SeasonDetail } from './season-detail/season-detail';
import { RaceDetail } from './race-detail/race-detail';
import { ClientAdmin } from './client-admin/client-admin';
import { DriverAdmin } from './driver-admin/driver-admin';
import { RacesAdmin } from './races-admin/races-admin';
import { RacesResponse } from './races-response/races-response';

export const routes: Routes = [
  { path: '', component: Leaderboard },
  { path: 'admin-f1-secreto-2026', component: Admin },
  { path: 'admin/season', component: SeasonsAdmin },
  { path: 'admin/season/:id', component: SeasonDetail },
  { path: 'admin/race/:id', component: RaceDetail },
  { path: 'admin/client', component: ClientAdmin },
  { path: 'admin/driver', component: DriverAdmin },
  { path: 'admin/races', component: RacesAdmin },
  { path: 'admin/races/response', component: RacesResponse }
];
