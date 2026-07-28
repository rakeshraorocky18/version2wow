import { Link } from 'react-router-dom';
import {
  Eye,
  Pencil,
  Phone,
  Mail,
  User,
  HeartHandshake,
} from 'lucide-react';
import type { AgentCustomer } from '../../types/agent';
import { getCustomerProfileImageUrl } from '../../lib/agent/customerAvatar';
import { ProfileProgress, StatusBadge } from './AgentUI';
import CustomerAvatar from './CustomerAvatar';

export default function CustomerCard({ customer }: { customer: AgentCustomer }) {
  const name = `${customer.firstName} ${customer.lastName || ''}`.trim();
  const imageUrl = getCustomerProfileImageUrl(customer);

  const workspaceUrl = `/agent/customers/${customer.id}`;
  const profileUrl = `/agent/customers/${customer.id}/profile`;
  const editUrl = `/agent/customers/${customer.id}/edit`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link to={workspaceUrl} className="block">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            <CustomerAvatar name={name} imageUrl={imageUrl} size={64} />
            <div>
              <h3 className="font-semibold text-lg text-wow-text hover:text-wow-primary transition">
                {name}
              </h3>
              <p className="text-xs text-gray-500">{customer.customerCode}</p>
            </div>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <Phone size={16} />
            <span>{customer.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Mail size={16} />
            <span>{customer.email || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <User size={16} />
            <span className="capitalize">{customer.gender || '—'}</span>
          </div>
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span>Profile Completion</span>
              <span>{customer.profileCompletion}%</span>
            </div>
            <ProfileProgress value={customer.profileCompletion} />
          </div>
          <div className="text-sm text-gray-500">
            Assigned on
            <div className="font-medium text-gray-700">
              {new Date(customer.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Link>

      <div className="border-t p-4 flex justify-center gap-5">
        <Link
          to={workspaceUrl}
          className="w-10 h-10 rounded-full bg-pink-50 text-wow-primary hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="Match workspace"
        >
          <HeartHandshake size={18} />
        </Link>
        <Link
          to={profileUrl}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="View profile"
        >
          <Eye size={18} />
        </Link>
        <Link
          to={editUrl}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="Edit customer"
        >
          <Pencil size={18} />
        </Link>
      </div>
    </div>
  );
}
