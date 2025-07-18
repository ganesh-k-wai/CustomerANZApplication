using Abp.Application.Services.Dto;
using System;

namespace MyTraining1101Demo.Customers.Dtos
{
    public class CustomerDto : EntityDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNo { get; set; }
        public string Address { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public string UserNames { get; set; }
    }
}
