import {
  Component,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
  CreateOrEditCustomerDto,
  CustomerDto,
  CustomerServiceProxy,
  UserLookupDto
} from '@shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
declare var $: any;

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  animations: [appModuleAnimation()]
})
export class CustomersComponent extends AppComponentBase implements OnInit {
  customers: CustomerDto[] = [];
  keyword = '';
  skipCount = 0;
  maxResultCount = 5;
  totalCount = 0;
  Math = Math;
  availableUsers: UserLookupDto[] = [];


   // Date picker configuration
  datePickerConfig: Partial<BsDatepickerConfig> = {
    containerClass: 'theme-default',
    showWeekNumbers: false,
    dateInputFormat: 'YYYY-MM-DD'
  };
  
  customerForm: FormGroup;
  isEditMode = false;
  saving = false;
  currentCustomerId: number | null = null;

  constructor(
    injector: Injector,
    private _customerService: CustomerServiceProxy,
    private _formBuilder: FormBuilder
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getCustomers();
    this.initializeForm();
  }

  initializeForm(): void {
    this.customerForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      registrationDate:[''],
      phoneNo: ['', [Validators.required]],
      address: ['']
    });
  }

  show(id: number | null): void {
    this.currentCustomerId = id;
    this.isEditMode = id !== null;
    
    if (id) {
      this.saving = true;
      this._customerService.getCustomerForEdit(id)
        .pipe(finalize(() => this.saving = false))
        .subscribe(result => {
          // Convert DateTime to JavaScript Date
          let registrationDate = null;
          if (result.customer.registrationDate) {
            // If it's a DateTime object, convert to JS Date
            if (result.customer.registrationDate.toJSDate) {
              registrationDate = result.customer.registrationDate.toJSDate();
            } else if (result.customer.registrationDate.toJSDate) {
              registrationDate = result.customer.registrationDate.toJSDate();
            } else {
              // Fallback: treat as string/ISO date
              registrationDate = new Date(result.customer.registrationDate.toString());
            }
          }

          this.customerForm.patchValue({
            name: result.customer.name,
            email: result.customer.email,
            registrationDate: registrationDate,
            phoneNo: result.customer.phoneNo,
            address: result.customer.address
          });
          this.showModal();
        });
    } else {
      this.customerForm.reset();
      this.showModal();
    }
  }


  private showModal(): void {
  if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
    $('#customerModal').modal('show');
  } else {
    const modalElement = document.getElementById('customerModal');
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.setAttribute('aria-modal', 'true');
      modalElement.removeAttribute('aria-hidden');
    }
  }
}

  private hideModal(): void {
  if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
    $('#customerModal').modal('hide');
  } else {
    const modalElement = document.getElementById('customerModal');
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.removeAttribute('aria-modal');
      modalElement.setAttribute('aria-hidden', 'true');
    }
  }
  }
  
  
save(): void {
    if (this.customerForm.invalid) {
      return;
    }

    this.saving = true;
    const customerDto = new CreateOrEditCustomerDto();
    customerDto.id = this.currentCustomerId || undefined;
    customerDto.name = this.customerForm.get('name').value;
    customerDto.email = this.customerForm.get('email').value;
  customerDto.phoneNo = this.customerForm.get('phoneNo').value;
  

    const registrationDate = this.customerForm.get('registrationDate').value;
    customerDto.registrationDate = registrationDate;
      
    customerDto.address = this.customerForm.get('address').value;
    this._customerService.createOrEdit(customerDto)
      .pipe(finalize(() => this.saving = false))
      .subscribe(() => {
        if (this.isEditMode) {
          this.notify.success('Customer updated successfully');
        } else {
          this.notify.success('Customer created successfully');
        }
        this.hideModal();
        this.getCustomers();
      });
  }

  getCustomers(): void {
    this._customerService
      .getAll(this.keyword, undefined, this.skipCount, this.maxResultCount)
      .subscribe(result => {
        this.customers = result.items;
        this.totalCount = result.totalCount;
      });
  }

  onSearch(): void {
    this.skipCount = 0;
    this.getCustomers();
  }

  nextPage(): void {
    this.skipCount += this.maxResultCount;
    this.getCustomers();
  }
   previousPage(): void {
    this.skipCount = Math.max(0, this.skipCount - this.maxResultCount);
    this.getCustomers();
  }


  deleteCustomer(id: number): void {
    this.message.confirm('Are you sure you want to delete?', 'Confirm', result => {
      if (result) {
        this._customerService.delete(id).subscribe(() => {
          this.notify.success('Customer deleted successfully.');
          this.getCustomers();
        });
      }
    });
  }

  viewUsers(id: number): void {
    this.message.info('This will show the associated users for customer ID: ' + id);
  }
}