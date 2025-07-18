import {
  Component,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';

import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
  CreateOrEditCustomerDto,
  CustomerDto,
  CustomerServiceProxy,
  UserLookupDto,
  UserServiceProxy,
  GetUsersInput
} from '@shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { AppConsts } from '@shared/AppConsts';
import { HttpClient } from '@angular/common/http';
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
 selectedUserIds: number[] = [];
  allUsers: UserLookupDto[] = [];

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
    private _formBuilder: FormBuilder,
    private _userService: UserServiceProxy,
    private http: HttpClient
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getCustomers();
    this.initializeForm();
    this.loadAllUsers();
  }

  initializeForm(): void {
    this.customerForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      registrationDate:[''],
      phoneNo: ['', [Validators.required]],
      address: [''],
      userIds: this._formBuilder.array([])
    });
  }

   get userIdsFormArray(): FormArray {
    return this.customerForm.get('userIds') as FormArray;
  }

loadAllUsers(): void {
  const url = AppConsts.remoteServiceBaseUrl + '/api/services/app/User/GetUsers';
  
  const userInput = new GetUsersInput();
  userInput.filter = '';
  userInput.onlyLockedUsers = false;
  userInput.skipCount = 0;
  userInput.maxResultCount = 1000;
  
  this.http.post<any>(url, userInput)
    .subscribe((result: any) => {
      this.allUsers = result.result?.items || [];
      this.updateAvailableUsers();
    }, error => {
      this.notify.error('Failed to load users');
      console.error('Error loading users:', error);
    });
}

  updateAvailableUsers(): void {
    this._customerService.getUnassignedUsers()
      .subscribe(result => {
        this.availableUsers = result;
        
        // If in edit mode, add currently assigned users to available list
        if (this.isEditMode && this.selectedUserIds.length > 0) {
          const currentlyAssignedUsers = this.allUsers.filter(user => 
            this.selectedUserIds.includes(user.id)
          );
          
          // Merge available users with currently assigned users (avoid duplicates)
          currentlyAssignedUsers.forEach(assignedUser => {
            if (!this.availableUsers.find(u => u.id === assignedUser.id)) {
              this.availableUsers.push(assignedUser);
            }
          });
        }
        
        this.updateUserCheckboxes();
      });
  }

   updateUserCheckboxes(): void {
    const userIdsArray = this.userIdsFormArray;
    userIdsArray.clear();
    
    this.availableUsers.forEach(user => {
      const isSelected = this.selectedUserIds.includes(user.id);
      userIdsArray.push(new FormControl(isSelected));
    });
  }

  onUserCheckboxChange(userId: number, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedUserIds.includes(userId)) {
        this.selectedUserIds.push(userId);
      }
    } else {
      const index = this.selectedUserIds.indexOf(userId);
      if (index > -1) {
        this.selectedUserIds.splice(index, 1);
      }
    }
  }

  show(id: number | null): void {
    this.currentCustomerId = id;
    this.isEditMode = id !== null;
    this.selectedUserIds = [];

    if (id) {
      this.saving = true;
      this._customerService.getCustomerForEdit(id)
        .pipe(finalize(() => this.saving = false))
        .subscribe(result => {

          this.selectedUserIds = result.assignedUserIds || [];

          let registrationDate = null;
          if (result.customer.registrationDate) {
            registrationDate = new Date(result.customer.registrationDate.toString());
          }

          this.customerForm.patchValue({
            name: result.customer.name,
            email: result.customer.email,
            registrationDate: registrationDate,
            phoneNo: result.customer.phoneNo,
            address: result.customer.address
          });
          this.updateAvailableUsers();
          this.showModal();
        });
    } else {
      this.customerForm.reset();
      this.updateAvailableUsers();
      this.showModal();
    }
  }

 private showModal(): void {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#customerModal').modal('show');
      }
    }, 100);
  }

  private hideModal(): void {
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#customerModal').modal('hide');
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
    customerDto.userIds = this.selectedUserIds;

    this._customerService.createOrEdit(customerDto)
      .pipe(finalize(() => this.saving = false))
      .subscribe(() => {
        if (this.isEditMode) {
          this.notify.success('Customer updated successfully');
        } else {
          this.notify.success('Customer created successfully');
        }
        this.cancel(); 
        this.getCustomers();
          this.loadAllUsers(); 
      });
  }

  cancel(): void {
    this.customerForm.reset();
    this.currentCustomerId = null;
    this.isEditMode = false;
    this.saving = false;
    this.selectedUserIds = [];
    this.hideModal();
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
           this.loadAllUsers();
        });
      }
    });
  }

  viewUsers(id: number): void {
    this.message.info('This will show the associated users for customer ID: ' + id);
  }

  getSelectedUserNames(): string {
     if (this.selectedUserIds.length === 0) {
      return '';
    }
     const selectedUsers = this.availableUsers.filter(user => 
      this.selectedUserIds.includes(user.id)
    );
    
    return selectedUsers.map(user => user.userName).join(', ');
  }

}