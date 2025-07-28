using my.company as my from '../db/schema';

@requires: 'authenticated-user'
@restrict: [{
    grant: '*',
    to   : 'admin'
},
{
    grant: 'READ',
    to   : 'viewer'
}]
service EmployeesService {
    entity Employees   as projection on my.Employees;
    entity Roles       as projection on my.Roles;
    entity Departments as projection on my.Departments;

    function getUserInfo() returns {};
}