using System.Collections.Generic;

namespace MyTraining1101Demo.Customers.Dtos
{
    public class GetCustomerForEditOutput
    {
        public CreateOrEditCustomerDto Customer { get; set; }
        public List<long> AssignedUserIds { get; set; } = new List<long>();
    }
}
