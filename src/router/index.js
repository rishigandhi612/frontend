import Vue from "vue";
import Router from "vue-router";

// Import components
import Login from "../components/Users/LoginUser.vue";
import UserDashboard from "../components/Users/UserDashboard.vue";
import CustomerList from "../components/Customers/CustomerList.vue";
import CustomerDetail from "@/components/Customers/CustomerDetail.vue";
import ProductList from "@/components/Products/ProductList.vue";
import ProductDetail from "@/components/Products/ProductDetail.vue";
import AddProduct from "@/components/Products/AddProduct.vue";
import AddInventory from "@/components/Inventory/AddInventory.vue";
import InvoiceList from "@/components/Invoices/InvoiceList.vue";
import InvoiceDetail from "@/components/Invoices/InvoiceDetail.vue";
import AddInvoice from "@/components/Invoices/AddInvoice.vue";
import UserList from "@/components/Users/UserList.vue";
import UserDetail from "@/components/Users/UserDetail.vue";
import AddUser from "@/components/Users/AddUser.vue";
import AddCustomer from "@/components/Customers/AddCustomer.vue";
import NotFound from "@/components/NotFound.vue";
import InventoryList from "@/components/Inventory/InventoryList.vue";
import InventoryDetail from "@/components/Inventory/InventoryDetail.vue";
import BatchAddInventory from "@/components/Inventory/BatchAddInventory.vue";
import SendEmail from "@/components/SendEmail.vue";
import AddTransporter from "@/components/Transporters/AddTransporter.vue";
import TransporterDetail from "@/components/Transporters/TransporterDetail.vue";
import TransporterList from "@/components/Transporters/TransporterList.vue";
import montlySummary from "@/components/InvoiceSummary/montlySummary.vue";
import visualData from "@/components/DataAnalytics/visualData.vue";
import CustomerInvoiceSummary from "@/components/Invoices/CustomerInvoice/CustomerInvoiceSummary.vue";
import BankList from "@/components/Bank/BankList.vue";
import BankDetail from "@/components/Bank/BankDetail.vue";
import AddEditBank from "@/components/Bank/AddEditBank.vue";
import inventoryImportCSV from "@/components/Inventory/inventoryImportCSV.vue";

Vue.use(Router);

// Define routes
const routes = [
  {
    path: "/",
    component: Login,
    name: "login",
  },
  {
    path: "/dashboard",
    component: UserDashboard,
    name: "userDashboard",
    meta: { requiresAuth: true },
  },
  {
    path: "/customer",
    component: CustomerList,
    name: "customerList",
    meta: { requiresAuth: true },
  },
  {
    path: "/customer/:id",
    component: CustomerDetail,
    name: "customerDetail",
    meta: { requiresAuth: true },
  },
  {
    path: "/product",
    component: ProductList,
    name: "productList",
    meta: { requiresAuth: true },
  },
  {
    path: "/inventory",
    component: InventoryList,
    name: "inventoryList",
    meta: { requiresAuth: true },
  },
  {
    path: "/product/:id",
    component: ProductDetail,
    name: "productDetail",
    meta: { requiresAuth: true },
  },
  {
    path: "/inventory/:id",
    component: InventoryDetail,
    name: "inventoryDetail",
    meta: { requiresAuth: true },
  },
  {
    path: "/addproduct",
    component: AddProduct,
    name: "addProduct",
    meta: { requiresAuth: true },
  },
  {
    path: "/addproduct/:id",
    component: AddProduct,
    name: "editProduct",
    meta: { requiresAuth: true },
  },
  {
    path: "/addinventory",
    component: AddInventory,
    name: "addInventory",
    meta: { requiresAuth: true },
  },
  {
    path: "/BatchAddinventory",
    component: BatchAddInventory,
    name: "BatchAddInventory",
    meta: { requiresAuth: true },
  },
  {
    path: "/addinventory/:id",
    component: AddInventory,
    name: "editInventory",
    meta: { requiresAuth: true },
  },
  {
    path: "/invoice",
    component: InvoiceList,
    name: "invoiceList",
    meta: { requiresAuth: true },
  },
  {
    path: "/invoice/:id",
    component: InvoiceDetail,
    name: "invoiceDetail",
    meta: { requiresAuth: true },
  },
  {
    path: "/addinvoice",
    component: AddInvoice,
    name: "addInvoice",
    meta: { requiresAuth: true },
  },
  {
    path: "/addinvoice/:id",
    component: AddInvoice,
    name: "editInvoice",
    meta: { requiresAuth: true },
  },
  {
    path: "/addcustomer",
    component: AddCustomer,
    name: "addCustomer",
    meta: { requiresAuth: true },
  },
  {
    path: "/addcustomer/:id",
    component: AddCustomer,
    name: "editCustomer",
    meta: { requiresAuth: true },
  },
  // BANK ROUTES - FIXED ORDER AND NAMES
  {
    path: "/banks",
    component: BankList,
    name: "bankList",
    meta: { requiresAuth: true },
  },
  {
    path: "/bank/:id?",
    component: BankDetail,
    name: "bankDetail",
    meta: { requiresAuth: true },
  },
  {
    path: "/addbank",
    component: AddEditBank,
    name: "addBank",
    meta: { requiresAuth: true },
  },
  {
    path: "/addbank/:id",
    component: AddEditBank,
    name: "editBank",
    meta: { requiresAuth: true },
  },
  {
    path: "/user",
    component: UserList,
    name: "UserList",
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id",
    component: UserDetail,
    name: "UserDetail",
    meta: { requiresAuth: true },
  },
  {
    path: "/adduser",
    component: AddUser,
    name: "addUser",
    meta: { requiresAuth: true },
  },
  {
    path: "/adduser/:id",
    component: AddUser,
    name: "EditUser",
    meta: { requiresAuth: true },
  },
  {
    path: "/SendPurchaseOrder",
    component: SendEmail,
    name: "SendPurchaseOrder",
    meta: { requiresAuth: true },
  },
  {
    path: "/addtransporter",
    component: AddTransporter,
    name: "AddTransporter",
    meta: { requiresAuth: true },
  },
  {
    path: "/addtransporter/:id",
    component: AddTransporter,
    name: "EditTransporter",
    meta: { requiresAuth: true },
  },
  {
    path: "/transporter/:id",
    component: TransporterDetail,
    name: "ViewTransporter",
    meta: { requiresAuth: true },
  },
  {
    path: "/transporter",
    component: TransporterList,
    name: "TransporterList",
    meta: { requiresAuth: true },
  },
  {
    path: "/monthlysummary",
    component: montlySummary,
    name: "monthlySummary",
    meta: { requiresAuth: true },
  },
  {
    path: "/visualdata",
    component: visualData,
    name: "visualData",
    meta: { requiresAuth: true },
  },
  {
    path: "/customer-invoices",
    component: CustomerInvoiceSummary,
    name: "customerInvoiceSummary",
    meta: { requiresAuth: true },
  },
  {
    path: "/inventory/import-csv",
    name: "inventoryImportCSV",
    component: inventoryImportCSV,
    meta: { requiresAuth: true },
  },
  {
    path: "*",
    component: NotFound,
    name: "notFound",
  },
];

// Create router instance
const router = new Router({
  mode: "history",
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      console.warn("Access denied: No token found. Redirecting to login.");
      next({ name: "login" });
    } else {
      next();
    }
  } else if (to.name === "login" && token) {
    console.info("User is logged in. Redirecting to dashboard.");
    next({ name: "userDashboard" });
  } else {
    next();
  }
});

export default router;
