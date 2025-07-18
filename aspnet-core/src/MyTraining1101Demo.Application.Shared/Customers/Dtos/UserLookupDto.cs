using Abp.Application.Services.Dto;

namespace MyTraining1101Demo.Customers.Dtos
{
    public class UserLookupDto
    {
        public long Id { get; set; }
        public string UserName { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string EmailAddress { get; set; }
    }

}
