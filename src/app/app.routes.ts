import { Routes } from '@angular/router';
import { MplusSignup } from './pages/mplus-signup/mplus-signup';
import { RaidSignup } from './pages/raid-signup/raid-signup';
import { GuildRoster } from './pages/guild-roster/guild-roster';

export const routes: Routes = [
    { path: '', redirectTo: 'mplus', pathMatch: 'full' },
    { path: 'mplus', component: MplusSignup },
    { path: 'raid', component: RaidSignup },
    { path: 'roster', component: GuildRoster },
];
