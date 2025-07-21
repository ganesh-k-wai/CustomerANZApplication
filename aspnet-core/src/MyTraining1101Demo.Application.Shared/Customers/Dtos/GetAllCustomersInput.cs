using Abp.Application.Services.Dto;

namespace MyTraining1101Demo.Customers.Dtos
{
    public class GetAllCustomersInput : PagedAndSortedResultRequestDto
    {
        public string Filter { get; set; } //dto for searching and paginaiton
    }
}
