import { Component , Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  animations: [appModuleAnimation()]
})
export class CustomersComponent extends AppComponentBase {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
  }

}
