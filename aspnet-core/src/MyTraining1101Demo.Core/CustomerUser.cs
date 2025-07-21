using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using MyTraining1101Demo.Authorization.Users;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyTraining1101Demo.Customers
{
    [Table("CustomerUsers")]
    public class CustomerUser : Entity
    {
        public int CustomerId { get; set; }
        public long UserId { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}