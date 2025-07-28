sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Component",
    "sap/ui/core/ComponentContainer"
], (Controller, Component, ComponentContainer) => {
    "use strict";

    return Controller.extend("listview.controller.DetailView", {

        onInit() {
            console.log("DetailView controller initialized");
            // Get route information
            var oRouter = this.getOwnerComponent().getRouter();
            var oRoute = oRouter.getRoute("RouteDetailView");
            if (oRoute) {
                console.log("Route found, attaching pattern matched");
                oRoute.attachPatternMatched(this._onRouteMatched, this);
            } else {
                console.error("RouteDetailView not found!");
            }
        },

        _onRouteMatched(oEvent) {
            console.log("Route matched - DetailView");
            var oArgs = oEvent.getParameter("arguments");
            var sEmployeeId = oArgs.employeeId || "new";
            console.log("Employee ID:", sEmployeeId);

            this._loadDetailComponent(sEmployeeId);
        },

        _loadDetailComponent(sEmployeeId) {
            console.log("Loading detail component for employee:", sEmployeeId);
            
            // Try to use component usage first
            try {
                const oOwnerComponent = this.getOwnerComponent();
                oOwnerComponent.createComponent("detail").then((oComponent) => {
                    console.log("DetailView component created via usage:", oComponent);
                    
                    // Set component data
                    oComponent.setComponentData({
                        employeeId: sEmployeeId,
                        parentController: this
                    });
                    
                    // Create ComponentContainer with the loaded component
                    const oComponentContainer = new ComponentContainer({
                        component: oComponent,
                        height: "100%"
                    });
                    
                    oComponentContainer.placeAt("detailPage");
                }).catch((error) => {
                    console.error("Error with component usage, falling back to direct creation:", error);
                    this._createComponentDirectly(sEmployeeId);
                });
            } catch (error) {
                console.error("Error creating component via usage:", error);
                this._createComponentDirectly(sEmployeeId);
            }
        },

        _createComponentDirectly(sEmployeeId) {
            // Create detailview component
            sap.ui.require([
                "sap/ui/core/Component"
            ], (Component) => {
                console.log("Component module loaded");
                Component.create({
                    name: "detailview",
                    manifest: true,
                    url: "/detailview/webapp",
                    settings: {
                        componentData: {
                            employeeId: sEmployeeId,
                            parentController: this
                        }
                    }
                }).then((oComponent) => {
                    // Create ComponentContainer with the loaded component
                    const oComponentContainer = new ComponentContainer({
                        component: oComponent,
                        height: "100%"
                    });
                    // Get the component container and set the component
                    console.log("DetailView component created:", oComponent);
                    oComponentContainer.placeAt("detailPage");
                });
            }).catch((oError) => {
                console.error("Error loading DetailView component:", oError);
            });
        },

        // Method to handle navigation back to list view
        onNavBack() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteListView");
        }
    });
});
