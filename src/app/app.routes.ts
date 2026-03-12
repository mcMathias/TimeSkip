import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { MplusSignup } from './pages/mplus-signup/mplus-signup';
import { RaidSignup } from './pages/raid-signup/raid-signup';
import { GuildRoster } from './pages/guild-roster/guild-roster';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'mplus', component: MplusSignup },
    { path: 'raid', component: RaidSignup },
    { path: 'roster', component: GuildRoster },
];
