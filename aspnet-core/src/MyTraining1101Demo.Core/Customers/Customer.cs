using Abp.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System;
using System.ComponentModel.DataAnnotations.Schema;

using MyTraining1101Demo.Authorization.Users;



namespace MyTraining1101Demo.Customers
{
        [Table("Customers")]
    public class Customer : Entity
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public string PhoneNo { get; set; }

        public string Address { get; set; }

        public long? UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
