import { Navigate, Route, Routes } from 'react-router-dom';
import AgentLayout from '../layouts/AgentLayout';
import AgentLogin from '../pages/agent/Login';
import AgentRegister from '../pages/agent/Register';
import AgentDashboard from '../pages/agent/Dashboard';
import AgentCustomers from '../pages/agent/Customers';
import AddCustomer from '../pages/agent/AddCustomer';
import CustomerDetails from '../pages/agent/CustomerDetails';
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
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="worksheet" element={<AgentWorksheet />} />
        <Route path="activity" element={<AgentActivity />} />
        <Route path="settings" element={<AgentSettings />} />
      </Route>
    </Routes>
  );
}
