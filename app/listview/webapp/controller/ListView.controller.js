sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "../model/formatter"
], (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, formatter) => {
    "use strict";

    return Controller.extend("listview.controller.ListView", {
        formatter: formatter,

        onInit() {
            this._loadRolesAndDepartments();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteListView").attachPatternMatched(this._refreshEmployeeData, this);
        },

        _refreshEmployeeData() {
            // Refresh employee table data
            const oTable = this.byId("employeeTable");
            if (oTable) {
                const oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                } else {
                    console.log("No binding found for employee table");
                }
            } else {
                console.log("Employee table not found");
            }
        },

        _loadRolesAndDepartments() {
            const oModel = this.getOwnerComponent().getModel();
            const oSearchModel = new JSONModel({
                filters: {
                    department: "",
                    level: ""
                }
            });

            this.getView().setModel(oSearchModel, "search");

            // OData V4 - Gọi service để lấy Roles
            const oRolesBinding = oModel.bindList("/Roles");
            oRolesBinding.requestContexts().then((aContexts) => {
                const roles = aContexts.map(oContext => oContext.getObject());
                const allRoles = [{ key: "", text: "All" }];

                // Thêm roles vào array
                roles.forEach(role => {
                    allRoles.push({
                        key: role.ID || role.id,
                        text: role.name || role.Name
                    });
                });

                // Cập nhật roles trong search model
                oSearchModel.setProperty("/roles", allRoles);
            }).catch((oError) => {
                console.error("Error loading roles:", oError);
            });

            // OData V4 - Gọi service để lấy Departments
            const oDepartmentsBinding = oModel.bindList("/Departments");
            oDepartmentsBinding.requestContexts().then((aContexts) => {
                const aDepartments = aContexts.map(oContext => oContext.getObject());
                const aDepartmentsList = [{ key: "", text: "All" }];

                // Thêm departments vào array
                aDepartments.forEach(dept => {
                    aDepartmentsList.push({
                        key: dept.ID || dept.id,
                        text: dept.name || dept.Name
                    });
                });

                // Cập nhật departments trong search model
                oSearchModel.setProperty("/departments", aDepartmentsList);
            }).catch((oError) => {
                console.error("Error loading departments:", oError);
            });
        },

        onSearchChange() {
            const oSearchModel = this.getView().getModel("search");
            const oTable = this.byId("employeeTable");
            const oBinding = oTable.getBinding("items");

            const sDepartment = oSearchModel.getProperty("/filters/department");
            const sRole = oSearchModel.getProperty("/filters/role");

            const aFilters = [];

            // Filter Department
            if (sDepartment) {
                aFilters.push(new Filter("department_ID", FilterOperator.EQ, sDepartment));
            }

            // Filter Role
            if (sRole) {
                aFilters.push(new Filter("role_ID", FilterOperator.EQ, sRole));
            }

            // Apply filters
            oBinding.filter(aFilters);

        },

        handleAddPress() {
            // Navigate to DetailView với parameter "new"
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetailView", {
                employeeId: "new"
            }, {
                TargetDetailView: {
                    route: "RouteDetailView",
                    parameters: {
                        employeeId: "new"
                    }
                }
            });
        },

        handleEmpPress() {
            // Navigate to ListView
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteListView");
        },

        onEditEmployee(oEvent) {
            // Get selected employee data
            const oContext = oEvent.getSource().getBindingContext();
            const oEmployeeData = oContext.getObject();

            // Navigate to DetailView with employee data
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetailView", {
                employeeId: oEmployeeData.ID
            }, {
                TargetDetailView: {
                    route: "RouteDetailView",
                    parameters: {
                        employeeId: oEmployeeData.ID
                    }
                },
                TargetDetailView2: {
                    route: "RouteDetailView",
                    parameters: {
                        employeeId: "new"
                    }
                }
            });
        },

        onDeleteEmployee(oEvent) {
            // Get selected employee data
            const oContext = oEvent.getSource().getBindingContext();
            const oEmployeeData = oContext.getObject();
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            // Confirm deletion dialog
            MessageBox.confirm(
                oResourceBundle.getText("confirmDeleteMessage", [oEmployeeData.firstName, oEmployeeData.lastName]),
                {
                    title: oResourceBundle.getText("confirmDeleteTitle"),
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.OK) {
                            this._deleteEmployee(oContext, oEmployeeData);
                        }
                    }
                }
            );
        },

        _deleteEmployee(oContext, oEmployeeData) {
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            try {
                // OData V4 delete using context
                oContext.delete().then(() => {
                    MessageToast.show(oResourceBundle.getText("employeeDeletedMessage", [oEmployeeData.firstName, oEmployeeData.lastName]));

                    // Refresh the table data
                    this._refreshEmployeeData();

                })
            } catch (oError) {
                MessageToast.show(oResourceBundle.getText("errorDeletingMessage"));
                console.error("Error deleting employee:", oError);
            }
        }
    });
});