using Abp.Application.Services;
using Abp.Application.Services.Dto;
using MyTraining1101Demo.Customers.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyTraining1101Demo.Customers
{
    public class CustomerAppService : ApplicationService, ICustomerAppService
    {
        public async Task<PagedResultDto<CustomerDto>> GetAll(GetAllCustomersInput input)
        {
            // Your implementation here
            throw new System.NotImplementedException();
        }

        public async Task<GetCustomerForEditOutput> GetCustomerForEdit(EntityDto input)
        {
            // Your implementation here
            throw new System.NotImplementedException();
        }

        public async Task CreateOrEdit(CreateOrEditCustomerDto input)
        {
            // Your implementation here
            throw new System.NotImplementedException();
        }

        public async Task Delete(EntityDto input)
        {
            // Your implementation here
            throw new System.NotImplementedException();
        }

        public async Task<List<UserLookupDto>> GetUnassignedUsers()
        {
            // Your implementation here
            throw new System.NotImplementedException();
        }
    }
}