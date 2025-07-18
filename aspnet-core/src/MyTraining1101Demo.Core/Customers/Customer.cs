using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using MyTraining1101Demo.Authorization.Users;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;



namespace MyTraining1101Demo.Customers
{
        [Table("Customers")]
    public class Customer : FullAuditedEntity
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public string PhoneNo { get; set; }

        public string Address { get; set; }

        public string UserIds { get; set; } // "[1,2,3]"

        // Helper property to work with List<int>
        [NotMapped]
        public List<long> UserIdsList
        {
            get
            {
                if (string.IsNullOrEmpty(UserIds))
                    return new List<long>();

                return JsonConvert.DeserializeObject<List<long>>(UserIds);
            }
            set
            {
                UserIds = JsonConvert.SerializeObject(value);
            }
        }
    }
}
