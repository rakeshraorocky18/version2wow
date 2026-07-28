import { Navigate, Route, Routes } from 'react-router-dom';
import AgentLayout from '../layouts/AgentLayout';
import AgentLogin from '../pages/agent/Login';
import AgentRegister from '../pages/agent/Register';
import AgentDashboard from '../pages/agent/Dashboard';
import AgentCustomers from '../pages/agent/Customers';
import AddCustomer from '../pages/agent/AddCustomer';
import CustomerProfile from '../pages/agent/CustomerProfile';
import CustomerDetails from '../pages/agent/CustomerDetails';
import CustomerDetailsWorkspace from '../pages/agent/CustomerDetailsWorkspace';
import MatchFullProfile from '../pages/agent/MatchFullProfile';
import AgentWorksheet from '../pages/agent/Worksheet';
import AgentActivity from '../pages/agent/Activity';
import AgentSettings from '../pages/agent/Settings';

export default function AgentRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AgentLogin />} />
      <Route path="register" element={<AgentRegister />} />

      <Route path="/" element={<AgentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="customers" element={<AgentCustomers />} />
        <Route path="customers/new" element={<AddCustomer />} />
        <Route path="add-customer" element={<AddCustomer />} />
        <Route path="customers/:customerId/manage" element={<CustomerDetails />} />
        <Route path="customers/:customerId/edit" element={<AddCustomer />} />
        <Route
          path="customers/:customerId/profile/:matchedProfileId"
          element={<MatchFullProfile />}
        />
        <Route path="customers/:customerId/profile" element={<CustomerProfile />} />
        <Route path="customers/:customerId" element={<CustomerDetailsWorkspace />} />
        <Route path="worksheet" element={<AgentWorksheet />} />
        <Route path="activity" element={<AgentActivity />} />
        <Route path="settings" element={<AgentSettings />} />
      </Route>
    </Routes>
  );
}
