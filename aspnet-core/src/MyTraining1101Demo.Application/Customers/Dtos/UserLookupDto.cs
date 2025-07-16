using Abp.Application.Services.Dto;

namespace MyTraining1101Demo.Customers.Dtos
{
    public class UserLookupDto : EntityDto<long>
    {
        public string UserName { get; set; }
    }
}
