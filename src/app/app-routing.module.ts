import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScreenshareComponent } from "./screenshare/screenshare.component";



const routes: Routes = [{ path: 'welcome', component: ScreenshareComponent },
{ path: '',   redirectTo: '/welcome', pathMatch: 'full' }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
