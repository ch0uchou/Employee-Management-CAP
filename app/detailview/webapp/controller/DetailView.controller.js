sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("detailview.controller.DetailView", {

        onInit() {
            // Check if we're in component mode (nested) or route mode
            const oComponentData = this.getOwnerComponent().getComponentData();

            if (oComponentData && oComponentData.employeeId !== undefined) {
                // Component mode - use component data
                // console.log(this._parentController);
                this._parentController = oComponentData.parentController;
                // console.log(this._parentController);
                // console.log(oComponentData.employeeId);
                this._handleComponentInit(oComponentData.employeeId);
            } else {
                // Route mode - use router (for backward compatibility)
                const oRouter = this.getOwnerComponent().getRouter();
                const oRoute = oRouter.getRoute("RouteDetailView");
                oRoute.attachPatternMatched(this._onRouteMatched, this);
            }

            this._loadRolesAndDepartments();
        },

        _handleComponentInit(sEmployeeId) {
            if (sEmployeeId && sEmployeeId !== "new") {
                this._loadEmployeeData(sEmployeeId);
            } else {
                this._createEmpModel();
            }
        },

        handleAddPress() {
            const oComponentData = this.getOwnerComponent().getComponentData();
            oComponentData.employeeId = "new";
            // Navigate to DetailView với parameter "new"
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetailView", {
                employeeId: "new"
            });
        },

        handleEmpPress() {
            // Check if we're in component mode
            const oComponentData = this.getOwnerComponent().getComponentData();

            if (oComponentData && this._parentController) {
                // Component mode - close dialog via parent controller
                // Since the structure is: Dialog -> ComponentContainer -> Component -> View
                // We need to traverse up to find the dialog
                this._closeDialogFromComponent();
            } else {
                // Route mode - navigate to ListView 
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteListView");
            }
        },

        _closeDialogFromComponent() {
            // Method 1: Use parent controller's stored dialog reference (most reliable)
            if (this._parentController && this._parentController._currentDialog) {
                console.log("Closing dialog via parent controller reference");
                this._parentController._currentDialog.close();
                return;
            }
        },

        onSave() {
            // Lấy data từ employee model
            const oEmployeeModel = this.getView().getModel("employee");
            const oEmployeeData = oEmployeeModel.getData();

            if (!this._validateForm(oEmployeeData)) {
                return; // Validation failed, do not proceed
            }

            // Get i18n resource bundle
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            // Show confirmation dialog before saving
            MessageBox.confirm(oResourceBundle.getText("confirmSaveMessage"), {
                title: oResourceBundle.getText("confirmSaveTitle"),
                onClose: (oAction) => {
                    if (oAction === MessageBox.Action.OK) {
                        this._performSave(oEmployeeData);
                    }
                }
            });
        },

        _performSave(oEmployeeData) {
            const oModel = this.getOwnerComponent().getModel();
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const oEmployee = {
                firstName: oEmployeeData.firstName,
                lastName: oEmployeeData.lastName,
                email: oEmployeeData.email,
                department_ID: oEmployeeData.department_ID,
                role_ID: oEmployeeData.role_ID,
                salary: parseFloat(oEmployeeData.salary) || 0,
                hireDate: this._formatDate(oEmployeeData.hireDate)
            };

            if (oEmployeeData.isEditMode && oEmployeeData.ID) {

                const sPath = `/Employees(${oEmployeeData.ID})`;
                const oBinding = oModel.bindContext(sPath);

                oBinding.requestObject().then(() => {
                    // Set properties one by one using the proper OData V4 way
                    const oContext = oBinding.getBoundContext();

                    Object.keys(oEmployee).forEach(sProperty => {
                        oContext.setProperty(sProperty, oEmployee[sProperty]);
                    });

                    // Submit batch to save changes
                    return oModel.submitBatch(oModel.getUpdateGroupId());
                }).then(() => {
                    MessageToast.show(oResourceBundle.getText("employeeUpdatedMessage"));
                    this.handleEmpPress();
                }).catch((oError) => {
                    MessageToast.show(oResourceBundle.getText("errorUpdatingMessage"));
                    console.error("Error updating employee:", oError);
                });
            } else {
                const oListBinding = oModel.bindList("/Employees");

                try {
                    // OData V4 create returns a context, not a promise
                    const oCreatedContext = oListBinding.create(oEmployee);

                    // Listen for the created event
                    oCreatedContext.created().then(() => {
                        MessageToast.show(oResourceBundle.getText("employeeCreatedMessage"));
                        this._clearForm();
                        this.handleEmpPress();
                    })
                } catch (oError) {
                    MessageToast.show(oResourceBundle.getText("errorCreatingMessage"));
                    console.error("Error creating employee:", oError);
                }
            }
        },

        onEmailLiveChange(oEvent) {
            const sValue = oEvent.getParameter("value");
            const oInput = oEvent.getSource();
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            if (sValue === "") {
                // Empty email is allowed
                oInput.setValueState("None");
                oInput.setValueStateText("");
                return;
            }

            // Email validation regex
            const rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;

            if (rexMail.test(sValue)) {
                oInput.setValueState("Success");
                oInput.setValueStateText(oResourceBundle.getText("validEmailAddress"));
            } else {
                oInput.setValueState("Error");
                oInput.setValueStateText(oResourceBundle.getText("validationInvalidEmail"));
            }
        },

        _validateForm(oEmployeeData) {
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            // Basic validation
            if (!oEmployeeData.firstName || !oEmployeeData.lastName || !oEmployeeData.email ||
                !oEmployeeData.department_ID || !oEmployeeData.role_ID || !oEmployeeData.hireDate) {
                MessageToast.show(oResourceBundle.getText("validationRequiredFields"));
                return false;
            }

            // Email validation
            const rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
            if (oEmployeeData.email && !rexMail.test(oEmployeeData.email)) {
                MessageToast.show(oResourceBundle.getText("validationInvalidEmail"));
                return false;
            }

            // All validation passed
            return true;
        },

        onCancel() {
            this._clearForm();
            // Navigate back to list
            this.handleEmpPress();
        },


        _onRouteMatched(oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            const sEmployeeId = oArgs.employeeId;

            if (sEmployeeId && sEmployeeId !== "new") {
                this._loadEmployeeData(sEmployeeId);
            } else {
                this._createEmpModel();
            }
        },

        _createEmpModel(oEmployeeData = null) {
            var oDefaultData = {
                firstName: "",
                lastName: "",
                email: "",
                department_ID: "",
                role_ID: "",
                salary: 0,
                hireDate: "",
                isEditMode: false
            };

            var oModelData = Object.assign({}, oDefaultData);
            if (oEmployeeData) {
                oModelData = {
                    ID: oEmployeeData.ID,
                    firstName: oEmployeeData.firstName || "",
                    lastName: oEmployeeData.lastName || "",
                    email: oEmployeeData.email || "",
                    department_ID: oEmployeeData.department_ID || "",
                    role_ID: oEmployeeData.role_ID || "",
                    salary: oEmployeeData.salary || 0,
                    hireDate: oEmployeeData.hireDate || "",
                    isEditMode: true
                };
            }

            var oModel = new JSONModel(oModelData);
            oModel.setDefaultBindingMode("TwoWay");
            this.getView().setModel(oModel, "employee");
            return oModel;
        },

        _loadEmployeeData(sEmployeeId) {
            const oModel = this.getOwnerComponent().getModel();

            // Bind context to the specific employee
            const sPath = `/Employees(${sEmployeeId})`;
            const oBinding = oModel.bindContext(sPath, null, {
                $expand: "department,role"
            });

            oBinding.requestObject().then((oEmployeeData) => {
                this._createEmpModel(oEmployeeData);
            }).catch((oError) => {
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                MessageToast.show(oResourceBundle.getText("errorLoadingEmployee"));
                console.error("Error loading employee:", oError);
                this._createEmpModel(); // Fallback to create mode
            });
        },


        _loadRolesAndDepartments() {
            const oModel = this.getOwnerComponent().getModel();
            const oSearchModel = new JSONModel({});

            this.getView().setModel(oSearchModel, "select");

            // OData V4 - Load Roles
            const oRolesBinding = oModel.bindList("/Roles");
            oRolesBinding.requestContexts().then((aContexts) => {
                const roles = aContexts.map(oContext => oContext.getObject());
                const allRoles = [];
                roles.forEach(role => {
                    allRoles.push({
                        key: role.ID || role.id,
                        text: role.name || role.Name
                    });
                });

                oSearchModel.setProperty("/roles", allRoles);
            }).catch((oError) => {
                console.error("Error loading roles:", oError);
            });

            // OData V4 - Load Departments
            const oDepartmentsBinding = oModel.bindList("/Departments");
            oDepartmentsBinding.requestContexts().then((aContexts) => {
                const departments = aContexts.map(oContext => oContext.getObject());
                const allDepartments = [];
                departments.forEach(dept => {
                    allDepartments.push({
                        key: dept.ID || dept.id,
                        text: dept.name || dept.Name
                    });
                });

                oSearchModel.setProperty("/departments", allDepartments);
            }).catch((oError) => {
                console.error("Error loading departments:", oError);
            });
        },

        _formatDate(sDate) {
            if (!sDate) return "";

            try {
                // if sDate format ISO (YYYY-MM-DD), return
                if (/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
                    return sDate;
                }

                // Parse date and convert to ISO format
                const oDate = new Date(sDate);

                if (isNaN(oDate.getTime())) {
                    console.error("Invalid date:", sDate);
                    return "";
                }
                const sYear = oDate.getFullYear();
                const sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
                const sDay = String(oDate.getDate()).padStart(2, '0');

                return `${sYear}-${sMonth}-${sDay}`;
            } catch (error) {
                console.error("Error formatting date:", error);
                return "";
            }
        },

        _clearForm() {
            // Reset form bằng cách tạo lại model rỗng
            this._createEmpModel();
        }
    });
});