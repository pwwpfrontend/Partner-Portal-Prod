import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getAllUsers, approveUserRole, deleteUser, getToken, getRole, api } from '../services/auth';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  Shield,
  User,
  Crown,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Building,
  MapPin,
  Plus
} from 'lucide-react';

const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleToSet, setRoleToSet] = useState('professional');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add User form state
  const [addUserForm, setAddUserForm] = useState({
    contactName: '',
    email: '',
    password: '',
    role: 'professional',
    companyName: '',
    companyAddress: '',
    businessType: 'other',
    phone: '',
    position: ''
  });
  const [addUserError, setAddUserError] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Debug auth context before API call
      const tokenPresent = !!getToken();
      const role = getRole();
      console.log('AdminUsers: fetching users with tokenPresent:', tokenPresent, 'role:', role);
      const data = await getAllUsers();
      const normalized = (data || []).map(u => ({
        id: u._id,
        name: u.contactPersonName || '-',
        email: u.email,
        company: u.companyName,
        phone: u.phoneNumber,
        location: u.companyAddress,
        status: u.role === 'pending' ? 'pending' : 'approved',
        role: u.role,
        // Try to detect uploaded document url from various possible fields
        documentUrl: u.certificate || u.certificateUrl || u.documentUrl || u.document || (Array.isArray(u.documents) ? u.documents[0] : (u.documents?.certificate || null)) || null,
        appliedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
        approvedDate: u.approvedAt ? new Date(u.approvedAt).toISOString().split('T')[0] : '',
      }));
      setUsers(normalized);
    } catch (error) {
      console.error('Error fetching users:', error?.response || error);
      const status = error?.response?.status;
      const backendMsg = error?.response?.data?.message;
      const msg = status
        ? `Failed to fetch users (HTTP ${status})${backendMsg ? `: ${backendMsg}` : ''}`
        : 'Failed to fetch users. Please check your connection and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Handle user approval with actual backend call
  const handleApproveUser = async (userId, newRole = 'professional') => {
    setActionLoading(true);
    try {
      await approveUserRole(userId, newRole);
      
      // Update local state after successful backend call
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'approved', role: newRole, approvedDate: new Date().toISOString().split('T')[0] }
          : user
      ));
      
      console.log(`User ${userId} approved with role: ${newRole}`);
    } catch (error) {
      console.error('Error approving user:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to approve user. Please try again.';
      alert(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user rejection (if backend supports it)
  const handleRejectUser = async (userId) => {
    setActionLoading(true);
    try {
      // TODO: Implement actual reject API call if backend supports it
      // For now, just update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'rejected', rejectedDate: new Date().toISOString().split('T')[0] }
          : user
      ));
      
      console.log(`User ${userId} rejected`);
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle open role modal
  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setRoleToSet(['professional','expert','master'].includes(user.role) ? user.role : 'professional');
    setShowRoleModal(true);
  };

  const submitRoleUpdate = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await approveUserRole(selectedUser.id, roleToSet);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: roleToSet, status: 'approved' } : u));
      setShowRoleModal(false);
      setSelectedUser(null);
      console.log(`User ${selectedUser.id} role updated to: ${roleToSet}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to update user role. Please try again.';
      alert(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Handle Add User form changes
  const handleAddUserFormChange = (e) => {
    setAddUserForm({ ...addUserForm, [e.target.name]: e.target.value });
  };

  // Reset Add User form
  const resetAddUserForm = () => {
    setAddUserForm({
      contactName: '',
      email: '',
      password: '',
      role: 'professional',
      companyName: '',
      companyAddress: '',
      businessType: 'other',
      phone: '',
      position: ''
    });
    setAddUserError('');
  };

  // Handle Add User submission - FIXED VERSION
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserError('');
    setActionLoading(true);

    // Basic validation
    if (!addUserForm.contactName || !addUserForm.email || !addUserForm.password) {
      setAddUserError('Name, email, and password are required.');
      setActionLoading(false);
      return;
    }

    try {
      // Try different API approaches based on common backend patterns
      let registerResponse;
      
      // Approach 1: Try with FormData (original approach)
      try {
        const fd = new FormData();
        fd.append("companyName", addUserForm.companyName || 'Admin Created');
        fd.append("companyAddress", addUserForm.companyAddress || 'Not specified');
        fd.append("businessType", addUserForm.businessType);
        fd.append("bussinessType", addUserForm.businessType); // compatibility with API key spelling
        fd.append("contactPersonName", addUserForm.contactName);
        fd.append("phoneNumber", addUserForm.phone || '');
        fd.append("email", addUserForm.email);
        fd.append("password", addUserForm.password);
        fd.append("position", addUserForm.position || 'Not specified');

        registerResponse = await api.post("/auth/register", fd, { 
          headers: { "Content-Type": "multipart/form-data" } 
        });
        
        console.log('User registration successful (FormData approach):', registerResponse.data);
      } catch (formDataError) {
        console.log('FormData approach failed, trying JSON approach...');
        
        // Approach 2: Try with JSON payload
        const jsonPayload = {
          companyName: addUserForm.companyName || 'Admin Created',
          companyAddress: addUserForm.companyAddress || 'Not specified',
          businessType: addUserForm.businessType,
          bussinessType: addUserForm.businessType, // compatibility
          contactPersonName: addUserForm.contactName,
          phoneNumber: addUserForm.phone || '',
          email: addUserForm.email,
          password: addUserForm.password,
          position: addUserForm.position || 'Not specified',
          role: 'pending' // Start as pending, then approve
        };

        registerResponse = await api.post("/auth/register", jsonPayload, {
          headers: { "Content-Type": "application/json" }
        });
        
        console.log('User registration successful (JSON approach):', registerResponse.data);
      }

      // Extract user ID from response
      const newUserId = registerResponse.data?.userId || 
                       registerResponse.data?.user?._id || 
                       registerResponse.data?.user?.id || 
                       registerResponse.data?.id ||
                       registerResponse.data?._id;
      
      if (!newUserId) {
        // If no user ID returned, try to extract from response message or use email as fallback
        console.warn('No user ID returned from registration, attempting alternative approaches');
        
        // Try to find user by email after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const allUsers = await getAllUsers();
          const newUser = allUsers.find(u => u.email === addUserForm.email);
          if (newUser && newUser._id) {
            console.log('Found newly created user by email:', newUser._id);
            
            // Auto-approve the user with the selected role
            try {
              await approveUserRole(newUser._id, addUserForm.role);
              console.log(`User auto-approved with role: ${addUserForm.role}`);
            } catch (approvalError) {
              console.error('Error auto-approving user:', approvalError);
              setAddUserError(`User created but failed to auto-approve. You can approve manually from the users list.`);
            }
            
            // Success path
            resetAddUserForm();
            setShowAddUserModal(false);
            await fetchUsers();
            return;
          }
        } catch (findUserError) {
          console.error('Error finding newly created user:', findUserError);
        }
        
        // If we can't find the user, show success message but mention manual approval needed
        setAddUserError('User may have been created but auto-approval failed. Please check the users list and approve manually if needed.');
        resetAddUserForm();
        setShowAddUserModal(false);
        await fetchUsers();
        return;
      }

      // If we have a user ID, proceed with auto-approval
      console.log('Attempting to auto-approve user with ID:', newUserId);
      
      // Wait a moment before approving to ensure the user is fully created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Auto-approve the user with the selected role
      try {
        await approveUserRole(newUserId, addUserForm.role);
        console.log(`User auto-approved with role: ${addUserForm.role}`);
      } catch (approvalError) {
        console.error('Error auto-approving user:', approvalError);
        // Don't throw here - the user was created successfully
        setAddUserError(`User created successfully but failed to auto-approve with role ${addUserForm.role}. You can approve manually. Error: ${approvalError?.response?.data?.message || approvalError.message}`);
      }

      // Reset form and close modal
      resetAddUserForm();
      setShowAddUserModal(false);
      
      // Refresh the users list to get the latest data from the server
      await fetchUsers();
      
      console.log('User added successfully by admin');
      
    } catch (error) {
      console.error('Error adding user:', error);
      
      // More detailed error handling
      let errorMsg = 'Failed to add user. ';
      
      if (error?.response?.status === 500) {
        errorMsg += 'Server error occurred. Please check if the email already exists or contact support.';
      } else if (error?.response?.status === 400) {
        errorMsg += error?.response?.data?.message || 'Invalid data provided.';
      } else if (error?.response?.status === 403) {
        errorMsg += 'You do not have permission to add users.';
      } else if (error?.response?.status === 409) {
        errorMsg += 'A user with this email already exists.';
      } else {
        errorMsg += error?.response?.data?.message || error.message || 'Please try again.';
      }
      
      setAddUserError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, name: 'Pending' },
      professional: { color: 'bg-green-100 text-green-800', icon: Shield, name: 'Professional' },
      expert: { color: 'bg-blue-100 text-blue-800', icon: User, name: 'Expert' },
      master: { color: 'bg-purple-100 text-purple-800', icon: Crown, name: 'Master' }
    };
    
    const config = roleConfig[role] || roleConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-5 h-5 mr-1" />
        {config.name}
      </span>
    );
  };

  // User Details Modal
  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedUser.phone}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Company</label>
                    <p className="text-gray-900">{selectedUser.company}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedUser.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedUser.documentUrl && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Submitted Document</h3>
                <div className="space-y-3">
                  {/* Quick open/download link */}
                  <a
                    href={selectedUser.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-2 text-sm bg-[#405952] text-white rounded hover:bg-[#2d3f38]"
                  >
                    Open Document
                  </a>
                  {/* Inline preview if image or PDF */}
                  {(() => {
                    const url = String(selectedUser.documentUrl || '').toLowerCase();
                    const isImage = url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.webp');
                    const isPdf = url.endsWith('.pdf');
                    if (isImage) {
                      return (
                        <div className="border rounded-md p-2 bg-gray-50">
                          <img src={selectedUser.documentUrl} alt="Uploaded Document" className="max-h-80 object-contain mx-auto" />
                        </div>
                      );
                    }
                    if (isPdf) {
                      return (
                        <div className="border rounded-md bg-gray-50" style={{ height: '420px' }}>
                          <iframe title="Document Preview" src={selectedUser.documentUrl} className="w-full h-full rounded-md" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Partnership Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Current Role</label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                {selectedUser.appliedDate && (
                  <div>
                    <label className="text-sm text-gray-500">Applied Date</label>
                    <p className="text-gray-900">{selectedUser.appliedDate}</p>
                  </div>
                )}
                {selectedUser.approvedDate && (
                  <div>
                    <label className="text-sm text-gray-500">Approved Date</label>
                    <p className="text-gray-900">{selectedUser.approvedDate}</p>
                  </div>
                )}
                {selectedUser.rejectedDate && (
                  <div>
                    <label className="text-sm text-gray-500">Rejected Date</label>
                    <p className="text-gray-900">{selectedUser.rejectedDate}</p>
                  </div>
                )}
              </div>
            </div>
            
            {selectedUser.notes && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{selectedUser.notes}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <main className="pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage partner applications, approve users, and assign partnership levels</p>
              </div>
              <button
                onClick={() => {
                  resetAddUserForm();
                  setShowAddUserModal(true);
                }}
                className="flex items-center px-4 py-2 bg-[#405952] text-white rounded-md hover:bg-[#30423f] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent appearance-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="pending">Pending</option>
                    <option value="professional">Professional</option>
                    <option value="expert">Expert</option>
                    <option value="master">Master</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Users ({filteredUsers.length})
              </h2>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#405952] mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading users...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-[#405952] text-white rounded-md hover:bg-[#30423f] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No users found matching your criteria</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#405952] flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.company}</div>
                          <div className="text-sm text-gray-500">{user.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id, 'professional')}
                                  disabled={actionLoading}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                                  title="Approve as Professional"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleOpenRoleModal(user)}
                                  disabled={actionLoading}
                                  className="text-gray-700 hover:text-gray-900 p-1 rounded hover:bg-gray-50 disabled:opacity-50"
                                  title="Update Role"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      {showUserModal && <UserDetailsModal />}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New User</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={addUserForm.contactName}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={addUserForm.email}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={addUserForm.password}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Type/Role *
                </label>
                <select
                  name="role"
                  value={addUserForm.role}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                >
                  <option value="professional">Professional</option>
                  <option value="expert">Expert</option>
                  <option value="master">Master</option>
                </select>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={addUserForm.companyName}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                  placeholder="Optional"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={addUserForm.phone}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                  placeholder="Optional"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={addUserForm.businessType}
                  onChange={handleAddUserFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
                >
                  <option value="other">Other</option>
                  <option value="reseller">Reseller</option>
                  <option value="integrator">System Integrator</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>

              {addUserError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {addUserError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)} 
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#405952] text-white rounded hover:bg-[#30423f] disabled:opacity-50 flex items-center"
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {actionLoading ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Update Role</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">Select a new role for <span className="font-medium">{selectedUser.name || selectedUser.email}</span>.</p>
              <select
                value={roleToSet}
                onChange={(e) => setRoleToSet(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#405952]"
              >
                <option value="professional">Professional</option>
                <option value="expert">Expert</option>
                <option value="master">Master</option>
              </select>
            </div>
            <div className="p-6 flex justify-end space-x-3 border-t">
              <button 
                onClick={() => setShowRoleModal(false)} 
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={submitRoleUpdate} 
                className="px-4 py-2 bg-[#405952] text-white rounded hover:bg-[#30423f] disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-700">Delete User</h3>
            </div>
            <div className="p-6 space-y-3">
              <p>Are you sure you want to delete <span className="font-medium">{selectedUser.name || selectedUser.email}</span>? This action cannot be undone.</p>
            </div>
            <div className="p-6 flex justify-end space-x-3 border-t">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    await deleteUser(selectedUser.id);
                    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                    console.log(`User ${selectedUser.id} deleted successfully`);
                  } catch (err) {
                    console.error('Delete failed', err);
                    const errorMsg = err?.response?.data?.message || 'Failed to delete user.';
                    alert(errorMsg);
                  } finally {
                    setActionLoading(false);
                  }
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
