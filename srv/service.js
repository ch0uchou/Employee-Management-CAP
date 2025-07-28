const cds = require('@sap/cds');

module.exports = class EmployeeService extends cds.ApplicationService {
   async init() {
    // Bonus amount per year of service
    const bonusPerYear = 1000;

    // Add user info endpoint
    this.on('getUserInfo', async (req) => {
      return {
        user: req.user,
      };
    });

    // Salary Calculation before create or update
    this.before(['CREATE', 'UPDATE'], 'Employees', async (req) => {
      const data = req.data;
      
      if (data.role_ID && data.hireDate) {
        // Get base salary from Roles table
        const { Roles } = this.entities;
        const role = await SELECT.one.from(Roles).where({ ID: data.role_ID });
        
        if (role && role.baseSalary) {
          // Calculate years of service
          const hireDate = new Date(data.hireDate);
          const currentDate = new Date();
          const yearsOfService = currentDate.getFullYear() - hireDate.getFullYear();
          
          // Calculate bonus: $1,000 per year of service
          const bonus = yearsOfService * bonusPerYear;
          // Calculate total salary
          data.salary = parseFloat(role.baseSalary) + bonus;
          
        }
        req.data = data;
      }
    });

    // Call the base class init method
    return super.init();
  }
}