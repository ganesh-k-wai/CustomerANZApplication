import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersComponent } from '../customers.component';
import { AppSharedModule } from '@app/shared/app-shared.module';


@NgModule({
  declarations: [CustomersComponent],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    AppSharedModule
  ]
})
export class CustomersModule { }
