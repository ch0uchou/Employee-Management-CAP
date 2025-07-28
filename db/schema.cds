using { cuid } from '@sap/cds/common';
namespace my.company;

@readonly
entity Roles : cuid {
    name: String;
    baseSalary: Decimal(10,2);
}

@readonly
entity Departments : cuid {
    name: String;
}

entity Employees : cuid {
    firstName: String;
    lastName: String;
    email: String;
    hireDate: Date;
    dateOfBirth: Date;
    gender: String;
    salary: Decimal(10,2);
    role: Association to Roles;
    department: Association to Departments;
}
