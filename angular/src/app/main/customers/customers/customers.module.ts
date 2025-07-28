import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersComponent } from '../customers.component';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomerServiceProxy } from '@shared/service-proxies/service-proxies';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';


@NgModule({
  declarations: [CustomersComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    CustomersRoutingModule,
    AppSharedModule,
   NgMultiSelectDropDownModule.forRoot()
    
  ],
  providers: [
    CustomerServiceProxy 
  ]
})
export class CustomersModule { }
