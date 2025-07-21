import {
  Component,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';

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
  templateUrl: 'customers.component.html',
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

  userSearchText: string = ''; 
  filteredUsers: UserLookupDto[] = [];

  // Template-driven form model
  customer: any = {
    name: '',
    email: '',
    registrationDate: null,
    phoneNo: '',
    address: ''
  };

  isEditMode = false;
  saving = false;
  currentCustomerId: number | null = null;

  constructor(
    injector: Injector,
    private _customerService: CustomerServiceProxy,
    private _userService: UserServiceProxy,
    private http: HttpClient
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getCustomers();
    this.loadAllUsers();
  }

    datePickerConfig: Partial<BsDatepickerConfig> = {
    containerClass: 'theme-default',
    showWeekNumbers: false,
    dateInputFormat: 'DD-MM-YYYY'
  };

 save(form: any): void {
    if (form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.saving = true;
    const customerDto = new CreateOrEditCustomerDto();
    customerDto.id = this.currentCustomerId || undefined;
    customerDto.name = this.customer.name;
    customerDto.email = this.customer.email;
    customerDto.phoneNo = this.customer.phoneNo;

    customerDto.registrationDate = this.customer.registrationDate;
      
    customerDto.address = this.customer.address;
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

   updateAvailableUsers(): void {
   
    this._customerService.getUnassignedUsers()
      .subscribe(result => {
        this.availableUsers = result;
        
        if (this.isEditMode && this.selectedUserIds.length > 0) {
          const currentlyAssignedUsers = this.allUsers.filter(user => 
            this.selectedUserIds.includes(user.id)
          );
          
          currentlyAssignedUsers.forEach(assignedUser => {
            if (!this.availableUsers.find(u => u.id === assignedUser.id)) {
              this.availableUsers.push(assignedUser);
            }
          });
        }
      });
  }

  onUserCheckboxChange(userId: number, event: any): void {
    const isChecked = event.target.checked;
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

          // Update the customer model
          this.customer = {
            name: result.customer.name,
            email: result.customer.email,
            registrationDate: registrationDate,
            phoneNo: result.customer.phoneNo,
            address: result.customer.address
          };
          
          this.updateAvailableUsers();
          this.showModal();
        });
    } else {
      // Reset customer model for new customer
      this.customer = {
        name: '',
        email: '',
        registrationDate: null,
        phoneNo: '',
        address: ''
      };
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
  
  cancel(): void {
    // Reset customer model
    this.customer = {
      name: '',
      email: '',
      registrationDate: null,
      phoneNo: '',
      address: ''
    };
    
    this.currentCustomerId = null;
    this.isEditMode = false;
    this.saving = false;
    this.selectedUserIds = [];
    this.hideModal();
  }

 getUserNameById(userId: number): string {
  const user = this.availableUsers.find(u => u.id === userId);
  return user ? user.userName : '';
}

  getCustomers(): void {
    this._customerService
      .getAll(this.keyword, undefined, this.skipCount, this.maxResultCount)
      .subscribe(result => {
        this.customers = result.items;
        this.customers.sort((a, b) => b.id - a.id);
        this.totalCount = result.totalCount;
      });
  }
  //pagination
  onSearch(): void {
    this.skipCount = 0;
    this.getCustomers();
  }
get currentPage(): number {
  return Math.floor(this.skipCount / this.maxResultCount) + 1;
}
get totalPages(): number {
  return Math.ceil(this.totalCount / this.maxResultCount);
}
getVisiblePages(): number[] {
  const pages: number[] = [];
  const totalPages = this.totalPages;
  const currentPage = this.currentPage;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + 4);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
}
goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
    this.skipCount = (page - 1) * this.maxResultCount;
    this.getCustomers();
  }
}
onPageSizeChange(): void {
  this.skipCount = 0; 
  this.getCustomers();
}
previousPage(): void {
  if (this.currentPage > 1) {
    this.goToPage(this.currentPage - 1);
  }
}
nextPage(): void {
  if (this.currentPage < this.totalPages) {
    this.goToPage(this.currentPage + 1);
  }
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

getSelectedUserNames(): string {
     if (this.selectedUserIds.length === 0) {
      return '';
    }
     const selectedUsers = this.availableUsers.filter(user => 
      this.selectedUserIds.includes(user.id)
    );
    
    return selectedUsers.map(user => user.userName).join(', ');
 }

filterUsers(): void {
  if (!this.userSearchText || this.userSearchText.trim() === '') {
    this.filteredUsers = [...this.assignedUsers];
    return;
  }
  
  const searchText = this.userSearchText.toLowerCase().trim();
  this.filteredUsers = this.assignedUsers.filter(user => 
    (user.userName && user.userName.toLowerCase().includes(searchText)) ||
    ((user.name || '') + ' ' + (user.surname || '')).toLowerCase().trim().includes(searchText) ||
    (user.emailAddress && user.emailAddress.toLowerCase().includes(searchText))
  );
}
    //view modal 
   viewCustomer: any = null; 
  assignedUsers: UserLookupDto[] = [];  
  viewUsers(id: number): void {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) {
      this.notify.error('Customer not found');
      console.log("eerrrrrrrrroe")
      return;
    }

    // Set the customer data for viewing
    this.viewCustomer = customer;
    this.userSearchText = '';
    if (customer.userNames && customer.userNames.trim() !== '') {
      const userNameArray = customer.userNames.split(',').map(name => name.trim());
      
      this.assignedUsers = this.allUsers.filter(user => 
        userNameArray.includes(user.userName)
      );
      this.filteredUsers = [...this.assignedUsers];
    } else {
      this.assignedUsers = [];
      this.filteredUsers = [];
    }

    this.showViewModal();
  }
  private showViewModal(): void {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#viewCustomerModal').modal('show');
      }
    }, 100);
  }

  closeViewModal(): void {
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#viewCustomerModal').modal('hide');
    }
    this.viewCustomer = null;
    this.assignedUsers = [];
      this.filteredUsers = [];
  this.userSearchText = '';
  }
  editFromView(): void {
    this.closeViewModal();
    this.show(this.viewCustomer.id);
  }

}