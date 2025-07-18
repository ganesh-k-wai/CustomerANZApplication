using Abp.Application.Services;
using Abp.Application.Services.Dto;
using MyTraining1101Demo.Customers.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyTraining1101Demo.Customers
{
    public interface ICustomerAppService : IApplicationService
    {
        Task<PagedResultDto<CustomerDto>> GetAll(GetAllCustomersInput input);

        Task<GetCustomerForEditOutput> GetCustomerForEdit(int id);

        Task CreateOrEdit(CreateOrEditCustomerDto input);

        Task Delete(EntityDto input);

        Task<List<UserLookupDto>> GetUnassignedUsers();
    }
}
