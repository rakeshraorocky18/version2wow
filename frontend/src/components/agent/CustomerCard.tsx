import { Link } from 'react-router-dom';
import {
  Eye,
  Pencil,
  StickyNote,
  FileText,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import type { AgentCustomer } from '../../types/agent';
import { ProfileProgress, StatusBadge } from './AgentUI';

export default function CustomerCard({ customer }: { customer: AgentCustomer }) {
  const name = `${customer.firstName} ${customer.lastName || ''}`.trim();

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const profileUrl = `/agent/customers/${customer.id}`;
  const manageUrl = `/agent/customers/${customer.id}/manage`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link to={profileUrl} className="block">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-pink-500 text-white font-semibold flex items-center justify-center text-lg">
              {initials}
            </div>
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

      <div className="border-t p-4 flex justify-around">
        <Link
          to={profileUrl}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="View profile"
        >
          <Eye size={18} />
        </Link>
        <Link
          to={`${manageUrl}?tab=personal`}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="Edit personal details"
        >
          <Pencil size={18} />
        </Link>
        <Link
          to={`${manageUrl}?tab=notes`}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="Notes"
        >
          <StickyNote size={18} />
        </Link>
        <Link
          to={`${manageUrl}?tab=documents`}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-500 hover:text-white flex items-center justify-center transition"
          title="Documents"
        >
          <FileText size={18} />
        </Link>
      </div>
    </div>
  );
}