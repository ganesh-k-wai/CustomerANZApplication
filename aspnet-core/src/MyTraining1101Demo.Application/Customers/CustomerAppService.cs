using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Collections.Extensions;
using Abp.Domain.Repositories;
using Abp.ObjectMapping;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MyTraining1101Demo.Authorization.Users;
using MyTraining1101Demo.Customers.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Linq.Extensions;
namespace MyTraining1101Demo.Customers
{
    public class CustomerAppService : ApplicationService, ICustomerAppService
    {
        private readonly IRepository<Customer> _customerRepository;
        private readonly IRepository<User, long> _userRepository;
        private readonly IObjectMapper _objectMapper;

        public CustomerAppService(
            IRepository<Customer> customerRepository,
            IRepository<User, long> userRepository,
            IObjectMapper objectMapper)
        {
            _customerRepository = customerRepository;
            _userRepository = userRepository;
            _objectMapper = objectMapper;
        }

        // GET: /api/services/app/Customer/GetAll
        public async Task<PagedResultDto<CustomerDto>> GetAll(GetAllCustomersInput input)
        {
            try
            {
                var filter = input.Filter?.Trim() ?? string.Empty;

                var query = (_customerRepository
                .GetAllIncluding(c => c.User))
                .WhereIf(!string.IsNullOrWhiteSpace(filter),
                    c => c.Name.Contains(filter) ||
                         c.Email.Contains(filter) ||
                         c.Address.Contains(filter));

                var totalCount = await query.CountAsync();

                var customers = await query
                    .OrderBy(c => c.Name)
                    .Skip(input.SkipCount)
                    .Take(input.MaxResultCount)
                    .ToListAsync();

                var customerDtos = ObjectMapper.Map<List<CustomerDto>>(customers);

                foreach (var dto in customerDtos)
                {
                    dto.UserName = customers.FirstOrDefault(x => x.Id == dto.Id)?.User?.UserName;
                }

                return new PagedResultDto<CustomerDto>(totalCount, customerDtos);
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException("An error occurred while retrieving customers.", ex);
            }
        }

        // GET: /api/services/app/Customer/GetCustomerForEdit?id=1
        public async Task<GetCustomerForEditOutput> GetCustomerForEdit(EntityDto input)
        {
            var customer = await _customerRepository.FirstOrDefaultAsync(input.Id);
            var output = new GetCustomerForEditOutput
            {
                Customer = ObjectMapper.Map<CreateOrEditCustomerDto>(customer)
            };
            return output;
        }

        // POST: /api/services/app/Customer/CreateOrEdit
        public async Task CreateOrEdit(CreateOrEditCustomerDto input)
        {
            if (input.Id == null || input.Id == 0)
            {
                await Create(input);
            }
            else
            {
                await Update(input);
            }
        }

        private async Task Create(CreateOrEditCustomerDto input)
        {
            var customer = ObjectMapper.Map<Customer>(input);
            await _customerRepository.InsertAsync(customer);
        }

        private async Task Update(CreateOrEditCustomerDto input)
        {
            var customer = await _customerRepository.FirstOrDefaultAsync((int)input.Id);
            if (customer == null)
                throw new UserFriendlyException("Customer not found");

            ObjectMapper.Map(input, customer);
        }

        // DELETE: /api/services/app/Customer/Delete?id=1
        public async Task Delete(EntityDto input)
        {
            await _customerRepository.DeleteAsync(input.Id);
        }

        // GET: /api/services/app/Customer/GetUnassignedUsers
        public async Task<List<UserLookupDto>> GetUnassignedUsers()
        {
            var assignedUserIds = await _customerRepository
                .GetAll()
                .Where(c => c.UserId != null)
                .Select(c => c.UserId.Value)
                .ToListAsync();

            var unassignedUsers = await _userRepository
                .GetAll()
                .Where(u => !assignedUserIds.Contains(u.Id))
                .ToListAsync();

            return unassignedUsers.Select(u => new UserLookupDto
            {
                Id = u.Id,
                UserName = u.UserName
            }).ToList();
        }
    }
}
