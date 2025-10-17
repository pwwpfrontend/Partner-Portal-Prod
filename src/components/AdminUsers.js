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
    position: '',
    country: ''
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
        name: u.contactPersonName || u.name || u.contactName || '-',
        email: u.email,
        company: u.companyName,
        // Fixed field mapping for phone number
        phone: u.phoneNumber || u.phone || '',
        // Fixed field mapping for location/address
        location: u.companyAddress || u.address || '',
        // Fixed field mapping for country
        country: u.country || u.companyCountry || '',
        status: u.role === 'pending' ? 'pending' : 'approved',
        role: u.role,
        position: u.position || '',
        businessType: u.businessType || u.bussinessType || '',
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
      user.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.country.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      position: '',
      country: ''
    });
    setAddUserError('');
  };

  // Handle Add User submission
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserError('');
    setActionLoading(true);

    // Basic validation
    if (!addUserForm.contactName || !addUserForm.email || !addUserForm.password || 
        !addUserForm.companyName || !addUserForm.companyAddress || !addUserForm.country ||
        !addUserForm.phone || !addUserForm.position) {
      setAddUserError('All fields are required. Please fill in all the information.');
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
        fd.append("country", addUserForm.country || 'Not specified');

        registerResponse = await api.post("/auth/register_no_recaptcha", fd, { 
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
          country: addUserForm.country || 'Not specified',
          role: 'pending' // Start as pending, then approve
        };

        registerResponse = await api.post("/auth/register_no_recaptcha", jsonPayload, {
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
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#FAFAFB]">
          {/* Top border */}
          <div className="h-1 bg-[#1B2150]"></div>
          
          <div className="p-6 border-b border-[#FAFAFB]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1B2150]">User Details</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-[#818181] hover:text-[#EB664D] transition-colors duration-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#FAFAFB] rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-[#1B2150] mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-[#818181]">Name</label>
                    <p className="text-gray-900 font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[#818181]">Email</label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-[#818181] mr-2" />
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[#818181]">Phone</label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-[#818181] mr-2" />
                      <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  {selectedUser.position && (
                    <div>
                      <label className="text-sm text-[#818181]">Position</label>
                      <p className="text-gray-900">{selectedUser.position}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-[#FAFAFB] rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-[#1B2150] mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Company Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-[#818181]">Company</label>
                    <p className="text-gray-900 font-medium">{selectedUser.company}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[#818181]">Address</label>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-[#818181] mr-2 mt-0.5" />
                      <p className="text-gray-900">{selectedUser.location || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[#818181]">Country</label>
                    <p className="text-gray-900">{selectedUser.country || 'Not provided'}</p>
                  </div>
                  {selectedUser.businessType && (
                    <div>
                      <label className="text-sm text-[#818181]">Business Type</label>
                      <p className="text-gray-900 capitalize">{selectedUser.businessType}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-[#818181]">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedUser.documentUrl && (
              <div className="mt-8 bg-[#FAFAFB] rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-[#1B2150] mb-4">Submitted Document</h3>
                <div className="space-y-3">
                  <a
                    href={selectedUser.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 text-sm bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D] transition-colors duration-200"
                  >
                    Open Document
                  </a>
                  {(() => {
                    const url = String(selectedUser.documentUrl || '').toLowerCase();
                    const isImage = url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.webp');
                    const isPdf = url.endsWith('.pdf');
                    if (isImage) {
                      return (
                        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                          <img src={selectedUser.documentUrl} alt="Uploaded Document" className="max-h-80 object-contain mx-auto" />
                        </div>
                      );
                    }
                    if (isPdf) {
                      return (
                        <div className="border-2 border-gray-200 rounded-xl bg-gray-50" style={{ height: '420px' }}>
                          <iframe title="Document Preview" src={selectedUser.documentUrl} className="w-full h-full rounded-xl" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}

            <div className="mt-8 bg-[#FAFAFB] rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-[#1B2150] mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Partnership Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[#818181]">Current Role</label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                {selectedUser.appliedDate && (
                  <div>
                    <label className="text-sm text-[#818181]">Applied Date</label>
                    <p className="text-gray-900">{selectedUser.appliedDate}</p>
                  </div>
                )}
                {selectedUser.approvedDate && (
                  <div>
                    <label className="text-sm text-[#818181]">Approved Date</label>
                    <p className="text-gray-900">{selectedUser.approvedDate}</p>
                  </div>
                )}
                {selectedUser.rejectedDate && (
                  <div>
                    <label className="text-sm text-[#818181]">Rejected Date</label>
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
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2 text-[#818181] bg-[#FAFAFB] rounded-lg hover:bg-gray-200 transition-colors duration-200"
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
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <main className="pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#1B2150]">User Management</h1>
                <p className="text-[#818181]">Manage partner applications, approve users, and assign partnership levels</p>
              </div>
              <button
                onClick={() => {
                  resetAddUserForm();
                  setShowAddUserModal(true);
                }}
                className="flex items-center px-6 py-3 bg-[#1B2150] text-white rounded-xl hover:bg-[#EB664D] transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#FAFAFB] mb-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#818181] w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, company, or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-[#FAFAFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-lg"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#818181] w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-12 pr-8 py-3 border-2 border-[#FAFAFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent appearance-none bg-[#FAFAFB] hover:bg-white transition-all duration-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#818181] w-4 h-4" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-12 pr-8 py-3 border-2 border-[#FAFAFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent appearance-none bg-[#FAFAFB] hover:bg-white transition-all duration-200"
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
          <div className="bg-white rounded-2xl shadow-lg border border-[#FAFAFB]">
            <div className="px-6 py-4 border-b border-[#FAFAFB] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#1B2150]">
                Users ({filteredUsers.length})
              </h2>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2 text-sm bg-[#FAFAFB] hover:bg-[#1B2150] hover:text-white rounded-lg transition-colors duration-200 disabled:opacity-50 text-[#1B2150] font-medium"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B2150] mx-auto"></div>
                  <p className="text-[#818181] mt-2">Loading users...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-[#EB664D]" />
                  <p className="text-[#818181] mb-4">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="px-6 py-3 bg-[#1B2150] text-white rounded-xl hover:bg-[#EB664D] transition-colors duration-200"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-[#818181]" />
                  <p className="text-[#818181]">No users found matching your criteria</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-[#FAFAFB]">
                  <thead className="bg-[#FAFAFB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Company & Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#FAFAFB]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FAFAFB] transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#1B2150] flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-[#1B2150]">{user.name}</div>
                              <div className="text-sm text-[#818181]">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#1B2150]">{user.company}</div>
                          <div className="text-sm text-[#818181] flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {user.country || user.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.phone && (
                            <div className="text-sm text-[#1B2150] flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                          {user.position && (
                            <div className="text-sm text-[#818181]">{user.position}</div>
                          )}
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
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id, 'professional')}
                                  disabled={actionLoading}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50 transition-colors duration-200"
                                  title="Approve as Professional"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  disabled={actionLoading}
                                  className="text-[#EB664D] hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors duration-200"
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
                                  className="text-[#1B2150] hover:text-[#EB664D] p-1 rounded hover:bg-[#FAFAFB] disabled:opacity-50 transition-colors duration-200"
                                  title="Update Role"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                  disabled={actionLoading}
                                  className="text-[#EB664D] hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors duration-200"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-[#FAFAFB]">
            {/* Top border */}
            <div className="h-1 bg-[#1B2150]"></div>
            
            <div className="p-6 border-b border-[#FAFAFB]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1B2150]">Add New User</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-[#818181] hover:text-[#EB664D] transition-colors duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={addUserForm.contactName}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={addUserForm.email}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={addUserForm.password}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Partner Type/Role *
                </label>
                <select
                  name="role"
                  value={addUserForm.role}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                >
                  <option value="professional">Professional</option>
                  <option value="expert">Expert</option>
                  <option value="master">Master</option>
                </select>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={addUserForm.companyName}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Company Address */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Company Address *
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  value={addUserForm.companyAddress}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={addUserForm.country}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={addUserForm.phone}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Position/Title *
                </label>
                <input
                  type="text"
                  name="position"
                  value={addUserForm.position}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-1">
                  Business Type *
                </label>
                <select
                  name="businessType"
                  value={addUserForm.businessType}
                  onChange={handleAddUserFormChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
                  required
                >
                  <option value="other">Other</option>
                  <option value="reseller">Reseller</option>
                  <option value="integrator">System Integrator</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>

              {addUserError && (
                <div className="text-[#EB664D] text-sm bg-red-50 p-3 rounded-xl border border-red-200">
                  {addUserError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#FAFAFB]">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)} 
                  className="px-4 py-2 bg-[#FAFAFB] rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D] disabled:opacity-50 flex items-center transition-colors duration-200"
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#FAFAFB]">
            {/* Top border */}
            <div className="h-1 bg-[#1B2150]"></div>
            
            <div className="p-6 border-b border-[#FAFAFB]">
              <h3 className="text-lg font-semibold text-[#1B2150]">Update Role</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#818181]">Select a new role for <span className="font-medium text-[#1B2150]">{selectedUser.name || selectedUser.email}</span>.</p>
              <select
                value={roleToSet}
                onChange={(e) => setRoleToSet(e.target.value)}
                className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white"
              >
                <option value="professional">Professional</option>
                <option value="expert">Expert</option>
                <option value="master">Master</option>
              </select>
            </div>
            <div className="p-6 flex justify-end space-x-3 border-t border-[#FAFAFB]">
              <button 
                onClick={() => setShowRoleModal(false)} 
                className="px-4 py-2 bg-[#FAFAFB] rounded-lg hover:bg-gray-200 transition-colors duration-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={submitRoleUpdate} 
                className="px-4 py-2 bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D] disabled:opacity-50 transition-colors duration-200"
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#FAFAFB]">
            {/* Top border */}
            <div className="h-1 bg-[#EB664D]"></div>
            
            <div className="p-6 border-b border-[#FAFAFB]">
              <h3 className="text-lg font-semibold text-[#EB664D]">Delete User</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-[#818181]">Are you sure you want to delete <span className="font-medium text-[#1B2150]">{selectedUser.name || selectedUser.email}</span>? This action cannot be undone.</p>
            </div>
            <div className="p-6 flex justify-end space-x-3 border-t border-[#FAFAFB]">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 bg-[#FAFAFB] rounded-lg hover:bg-gray-200 transition-colors duration-200"
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
                className="px-4 py-2 bg-[#EB664D] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
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