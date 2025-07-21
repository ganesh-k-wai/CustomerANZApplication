using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Collections.Extensions;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.ObjectMapping;
using Abp.UI;
using Castle.Core.Resource;
using Microsoft.EntityFrameworkCore;
using MyTraining1101Demo.Authorization.Users;
using MyTraining1101Demo.Customers.Dtos;
using Stripe;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTraining1101Demo.Customers
{
    public class CustomerAppService : ApplicationService, ICustomerAppService
    {
        private readonly IRepository<Customer> _customerRepository;
        private readonly IRepository<CustomerUser> _customerUserRepository;
        private readonly IRepository<User, long> _userRepository;
        private readonly IObjectMapper _objectMapper;

        public CustomerAppService(
            IRepository<Customer> customerRepository,
    IRepository<User, long> userRepository,
    IRepository<CustomerUser> customerUserRepository, 
    IObjectMapper objectMapper)
        {
            _customerRepository = customerRepository;
            _userRepository = userRepository;
            _customerUserRepository = customerUserRepository;
            _objectMapper = objectMapper;
        }

        // GET: /api/services/app/Customer/GetAll
        public async Task<PagedResultDto<CustomerDto>> GetAll(GetAllCustomersInput input)
        {
            var filter = input.Filter?.Trim() ?? string.Empty;

            var query = _customerRepository.GetAll()
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

            var customerDtos = _objectMapper.Map<List<CustomerDto>>(customers);

            var customerIds = customers.Select(c => c.Id).ToList();

            var mappings = await _customerUserRepository.GetAll()
                .Where(cu => customerIds.Contains(cu.CustomerId))
                .Include(cu => cu.User)
                .ToListAsync();


            foreach (var dto in customerDtos)
            {
                var assignedUsers = mappings
                    .Where(cu => cu.CustomerId == dto.Id)
                    .Select(cu => cu.User?.UserName)
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .ToList();

                dto.UserNames = string.Join(", ", assignedUsers);
            }

            return new PagedResultDto<CustomerDto>(totalCount, customerDtos);
        }

        // GET: /api/services/app/Customer/GetCustomerForEdit?id=1
        public async Task<GetCustomerForEditOutput> GetCustomerForEdit(int id)
        {
            var customer = await _customerRepository.GetAsync(id);


            var assignedUserIds = await _customerUserRepository
           .GetAll()
           .Where(cu => cu.CustomerId == customer.Id)
           .Select(cu => cu.UserId)
           .ToListAsync();

            var userIds = await _customerUserRepository
                .GetAll()
                .Where(x => x.CustomerId == customer.Id)
                .Select(x => x.UserId)
                .ToListAsync();

            return new GetCustomerForEditOutput
            {
                Customer = new CreateOrEditCustomerDto
                {
                    Id = customer.Id,
                    Name = customer.Name,
                    Email = customer.Email,
                    RegistrationDate = customer.RegistrationDate,
                    PhoneNo = customer.PhoneNo,
                    Address = customer.Address,
                    UserIds = assignedUserIds
                },
                AssignedUserIds = assignedUserIds
            };
        }

        // POST: /api/services/app/Customer/CreateOrEdit
        public async Task CreateOrEdit(CreateOrEditCustomerDto input)
        {
            if (input.Id.HasValue)
                await UpdateCustomer(input);
            else
                await CreateCustomer(input);
        }

        private async Task CreateCustomer(CreateOrEditCustomerDto input)
        {
            var customer = new Customer
            {
                Name = input.Name,
                Email = input.Email,
                RegistrationDate = input.RegistrationDate,
                PhoneNo = input.PhoneNo,
                Address = input.Address
            };

            await _customerRepository.InsertAsync(customer);
            await CurrentUnitOfWork.SaveChangesAsync(); 

            foreach (var userId in input.UserIds)
            {
                await _customerUserRepository.InsertAsync(new CustomerUser
                {
                    CustomerId = customer.Id,
                    UserId = userId
                });
            }
        }


        private async Task UpdateCustomer(CreateOrEditCustomerDto input)
        {
            var customer = await _customerRepository.GetAsync(input.Id.Value);

            customer.Name = input.Name;
            customer.Email = input.Email;
            customer.RegistrationDate = input.RegistrationDate;
            customer.PhoneNo = input.PhoneNo;
            customer.Address = input.Address;

            await _customerRepository.UpdateAsync(customer);

            var existingMappings = await _customerUserRepository
                .GetAll()
                .Where(cu => cu.CustomerId == customer.Id)
                .ToListAsync();

            foreach (var mapping in existingMappings)
            {
                await _customerUserRepository.DeleteAsync(mapping);
            }

            foreach (var userId in input.UserIds)
            {
                await _customerUserRepository.InsertAsync(new CustomerUser
                {
                    CustomerId = customer.Id,
                    UserId = userId
                });
            }
        }


        // DELETE: /api/services/app/Customer/Delete?id=1
        public async Task Delete(EntityDto input)
        {
            await _customerRepository.DeleteAsync(input.Id);
            await _customerUserRepository.DeleteAsync(x => x.CustomerId == input.Id);
        }

        // GET: /api/services/app/Customer/GetUnassignedUsers
        public async Task<List<UserLookupDto>> GetUnassignedUsers()
        {
            var assignedUserIds = await _customerUserRepository
                .GetAll()
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync();

            var unassignedUsers = await _userRepository
                .GetAll()
                .Where(u => !assignedUserIds.Contains(u.Id))
                .Select(u => new UserLookupDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Name = u.Name,
                    Surname = u.Surname,
                    EmailAddress = u.EmailAddress
                })
                .ToListAsync();

            return unassignedUsers;
        }
    }
}
