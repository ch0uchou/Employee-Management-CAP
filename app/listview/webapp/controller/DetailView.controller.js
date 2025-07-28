sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Component",
    "sap/ui/core/ComponentContainer"
], (Controller, Component, ComponentContainer) => {
    "use strict";

    return Controller.extend("listview.controller.DetailView", {

        onInit() {
            // Get route information
            var oRouter = this.getOwnerComponent().getRouter();
            var oRoute = oRouter.getRoute("RouteDetailView");
            if (oRoute) {
                oRoute.attachPatternMatched(this._onRouteMatched, this);
            }
        },

        _onRouteMatched(oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var sEmployeeId = oArgs.employeeId || "new";
            
            this._loadDetailComponent(sEmployeeId);
        },

        _loadDetailComponent(sEmployeeId) {
            // Create detailview component
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
                // Get the component container and set the component
                var oContainer = this.byId("detailComponentContainer");
                if (oContainer) {
                    oContainer.setComponent(oComponent);
                }
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
