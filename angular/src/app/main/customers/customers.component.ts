import {
  Component,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
  CustomerDto,
  CustomerServiceProxy
} from '@shared/service-proxies/service-proxies';
import { CreateOrEditCustomerModalComponent } from './create-or-edit-customer-modal.component';

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

  @ViewChild('customerModal', { static: true })
  customerModal: CreateOrEditCustomerModalComponent;

  constructor(
    injector: Injector,
    private _customerService: CustomerServiceProxy
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getCustomers();
  }

 show(id: number | null): void {
    throw new Error('Method not implemented.');
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

  changePage(event: any): void {
    this.skipCount = event.pageIndex * event.pageSize;
    this.maxResultCount = event.pageSize;
    this.getCustomers();
  }

  createCustomer(): void {
    this.customerModal.show(null); // null means create
  }

  editCustomer(id): void {
    this.customerModal.show(id); 
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
    // Optional: open a Bootstrap modal to show related user info
  }
}
