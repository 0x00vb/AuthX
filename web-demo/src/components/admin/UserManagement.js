import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import AuthContext from '../../context/AuthContext';

const UserManagement = () => {
  const { getAllUsers, assignRole } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  
  // Role management state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleAssignLoading, setRoleAssignLoading] = useState(false);
  
  // Available roles
  const availableRoles = ['client', 'mechanic', 'admin'];

  // Fetch users on component mount using useCallback to prevent infinite re-renders
  const fetchUsers = useCallback(async () => {
    // If we've already failed once, don't keep retrying automatically
    if (fetchFailed) return;
    
    try {
      setLoading(true);
      const userData = await getAllUsers();
      setUsers(userData || []);
      setError(null);
      setFetchFailed(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || 'Failed to fetch users');
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers, fetchFailed]);

  // Use useEffect with the callback
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Retry button handler
  const handleRetry = () => {
    setFetchFailed(false);
    fetchUsers();
  };

  // Open role assignment modal
  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole('');
    setShowRoleModal(true);
  };
  
  // Close role assignment modal
  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    setSelectedRole('');
  };
  
  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      setRoleAssignLoading(true);
      await assignRole(selectedUser.id, selectedRole);
      
      // Update local state to reflect the change
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          // Add the role if not already present
          if (!user.roles.includes(selectedRole)) {
            return {
              ...user,
              roles: [...user.roles, selectedRole]
            };
          }
        }
        return user;
      });
      
      setUsers(updatedUsers);
      handleCloseRoleModal();
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setRoleAssignLoading(false);
    }
  };

  // Handle removing a role from a user
  const handleRemoveRole = async (userId, roleToRemove) => {
    // In a real application, you would call an API to remove the role
    // For this demo, we'll just update the local state
    
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          roles: user.roles.filter(role => role !== roleToRemove)
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">User Management</h2>
      
      <div className="alert alert-primary mb-4">
        <strong>Role-Based Access:</strong> This page is only accessible to users with the "admin" role. Here you can manage users and their roles.
      </div>
      
      <Card>
        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Users</h5>
          <Button variant="success" size="sm">
            <i className="bi bi-plus-circle me-1"></i> Add New User
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading users...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3">
              <p>{error}</p>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleRetry}
              >
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="alert alert-info m-3">
              No users found.
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.roles?.map((role) => (
                        <Badge 
                          key={role} 
                          bg={
                            role === 'admin' 
                              ? 'danger' 
                              : role === 'mechanic' 
                                ? 'success' 
                                : 'info'
                          }
                          className="me-1 mb-1 position-relative"
                        >
                          {role}
                          {user.roles.length > 1 && (
                            <button 
                              className="badge bg-light text-dark border-0 rounded-circle position-absolute top-0 end-0 translate-middle"
                              style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}
                              onClick={() => handleRemoveRole(user.id, role)}
                              title={`Remove ${role} role`}
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </td>
                    <td>
                      <Badge bg={user.isActive ? 'success' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="me-1"
                        onClick={() => handleOpenRoleModal(user)}
                      >
                        <i className="bi bi-shield-plus me-1"></i>
                        Assign Role
                      </Button>
                      <Button variant="outline-primary" size="sm" className="me-1">
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <i className="bi bi-trash me-1"></i>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Role Assignment Modal */}
      <Modal show={showRoleModal} onHide={handleCloseRoleModal}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p><strong>User:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
              <p><strong>Current Roles:</strong> {selectedUser.roles.join(', ')}</p>
              <Form.Group className="mb-3">
                <Form.Label>Select Role to Assign:</Form.Label>
                <Form.Select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Select a role...</option>
                  {availableRoles.filter(role => !selectedUser.roles.includes(role)).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRoleModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignRole}
            disabled={!selectedRole || roleAssignLoading}
          >
            {roleAssignLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Assigning...</span>
              </>
            ) : 'Assign Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement; 