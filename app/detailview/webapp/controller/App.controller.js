sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("detailview.controller.App", {
      onInit() {
          // Initialize router to navigate to DetailView automatically
          var oRouter = this.getOwnerComponent().getRouter();
          if (oRouter) {
              oRouter.initialize();
              
              // Get component data to determine which route to navigate to
              var oComponentData = this.getOwnerComponent().getComponentData();
              if (oComponentData && oComponentData.employeeId) {
                  oRouter.navTo("RouteDetailView", {
                      employeeId: oComponentData.employeeId
                  });
              } else {
                  oRouter.navTo("DetailView");
              }
          }
      }
  });
});