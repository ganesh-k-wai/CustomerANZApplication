using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Collections.Extensions;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.ObjectMapping;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MyTraining1101Demo.Authorization.Users;
using MyTraining1101Demo.Customers.Dtos;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

                var customerDtos = ObjectMapper.Map<List<CustomerDto>>(customers);

                var allUserIds = new List<long>();
                foreach (var customer in customers)
                {
                    if (!string.IsNullOrEmpty(customer.UserIds))
                    {
                        try
                        {
                            var userIds = JsonConvert.DeserializeObject<List<long>>(customer.UserIds);
                            allUserIds.AddRange(userIds);
                        }
                        catch
                        {
                        }
                    }
                }

                var users = new Dictionary<long, string>();
                if (allUserIds.Any())
                {
                    var userList = await _userRepository
                        .GetAll()
                        .Where(u => allUserIds.Contains(u.Id))
                        .Select(u => new { u.Id, u.UserName })
                        .ToListAsync();

                    users = userList.ToDictionary(u => u.Id, u => u.UserName);
                }

                foreach (var dto in customerDtos)
                {
                    var customer = customers.FirstOrDefault(c => c.Id == dto.Id);
                    if (customer != null && !string.IsNullOrEmpty(customer.UserIds))
                    {
                        try
                        {
                            var userIds = JsonConvert.DeserializeObject<List<long>>(customer.UserIds);
                            var userNames = userIds
                                .Where(id => users.ContainsKey(id))
                                .Select(id => users[id])
                                .ToList();

                            dto.UserNames = string.Join(", ", userNames); 
                        }
                        catch
                        {
                            dto.UserNames = ""; 
                        }
                    }
                    else
                    {
                        dto.UserNames = "";
                    }
                }

                return new PagedResultDto<CustomerDto>(totalCount, customerDtos);
            
            
        }

        // GET: /api/services/app/Customer/GetCustomerForEdit?id=1
        public async Task<GetCustomerForEditOutput> GetCustomerForEdit(int id)
        {
            var customer = await _customerRepository.GetAsync(id);

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
                    UserIds = customer.UserIdsList // Convert from JSON to List
                },
                AssignedUserIds = customer.UserIdsList
            };
        }

        // POST: /api/services/app/Customer/CreateOrEdit
        public async Task CreateOrEdit(CreateOrEditCustomerDto input)
        {
            if (input.Id.HasValue)
            {
                await UpdateCustomer(input);
            }
            else
            {
                await CreateCustomer(input);
            }
        }

        private async Task CreateCustomer(CreateOrEditCustomerDto input)
        {
            var customer = new Customer
            {
                Name = input.Name,
                Email = input.Email,
                RegistrationDate = input.RegistrationDate,
                PhoneNo = input.PhoneNo,
                Address = input.Address,
                UserIdsList = input.UserIds 
            };

            await _customerRepository.InsertAsync(customer);
        }

        private async Task UpdateCustomer(CreateOrEditCustomerDto input)
        {
            var customer = await _customerRepository.GetAsync(input.Id.Value);

            customer.Name = input.Name;
            customer.Email = input.Email;
            customer.RegistrationDate = input.RegistrationDate;
            customer.PhoneNo = input.PhoneNo;
            customer.Address = input.Address;
            customer.UserIdsList = input.UserIds; 

            await _customerRepository.UpdateAsync(customer);
        }

        // DELETE: /api/services/app/Customer/Delete?id=1
        public async Task Delete(EntityDto input)
        {
            await _customerRepository.DeleteAsync(input.Id);
        }

        // GET: /api/services/app/Customer/GetUnassignedUsers
        public async Task<List<UserLookupDto>> GetUnassignedUsers()
        {
            // Get all assigned user IDs from all customers
            var allCustomers = await _customerRepository.GetAllListAsync();
            var assignedUserIds = new List<long>();

            foreach (var customer in allCustomers)
            {
                assignedUserIds.AddRange(customer.UserIdsList);
            }

            // Get users not in assigned list
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
