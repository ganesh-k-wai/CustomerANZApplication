using Abp.Application.Services.Dto;
using System;

namespace MyTraining1101Demo.Customers.Dtos
{
    public class CreateOrEditCustomerDto : EntityDto<int?>
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNo { get; set; }
        public string Address { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public long? UserId { get; set; }
    }
}
