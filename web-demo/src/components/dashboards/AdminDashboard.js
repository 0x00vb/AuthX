import React, { useContext, useState, useEffect } from 'react';
import { Card, Row, Col, ListGroup, Badge, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const AdminDashboard = () => {
  const { currentUser, getAllUsers } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample stats
  const stats = {
    totalUsers: 24,
    activeUsers: 18,
    newUsers: 3,
    totalClients: 15,
    totalMechanics: 5,
    totalAdmins: 4
  };

  // Sample system logs
  const systemLogs = [
    { id: 1, action: 'User Login', user: 'john.doe@example.com', timestamp: '2023-06-15 08:23:45', status: 'Success' },
    { id: 2, action: 'Password Reset', user: 'jane.smith@example.com', timestamp: '2023-06-15 09:45:12', status: 'Success' },
    { id: 3, action: 'Role Change', user: 'mike.johnson@example.com', timestamp: '2023-06-15 10:12:34', status: 'Success' },
    { id: 4, action: 'Failed Login', user: 'unknown@example.com', timestamp: '2023-06-15 11:05:22', status: 'Failed' },
    { id: 5, action: 'User Registration', user: 'sarah.williams@example.com', timestamp: '2023-06-15 14:18:47', status: 'Success' }
  ];

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userData = await getAllUsers();
        setUsers(userData || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [getAllUsers]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="alert alert-danger">
        <strong>Role-Based Access:</strong> This page is only accessible to users with the "admin" role.
      </div>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">Admin Profile</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '60px', height: '60px', fontSize: '24px' }}
                >
                  {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                </div>
                <div>
                  <h4>{currentUser?.firstName} {currentUser?.lastName}</h4>
                  <p className="text-muted mb-0">{currentUser?.email}</p>
                </div>
              </div>
              
              <ListGroup variant="flush" className="mt-3">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Role
                  <Badge bg="danger">Administrator</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Access Level
                  <Badge bg="primary">Full Access</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Last Login
                  <span>Today, {new Date().toLocaleTimeString()}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item action as={Link} to="/admin/users" className="py-3">
                  <i className="bi bi-people me-2"></i> Manage Users
                </ListGroup.Item>
                <ListGroup.Item action className="py-3">
                  <i className="bi bi-shield-lock me-2"></i> Manage Roles
                </ListGroup.Item>
                <ListGroup.Item action className="py-3">
                  <i className="bi bi-gear me-2"></i> System Settings
                </ListGroup.Item>
                <ListGroup.Item action className="py-3">
                  <i className="bi bi-file-earmark-text me-2"></i> View Logs
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Row>
            <Col sm={6} md={4} className="mb-3">
              <Card className="bg-primary text-white h-100">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                  <h1 className="display-4">{stats.totalUsers}</h1>
                  <p className="mb-0">Total Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={4} className="mb-3">
              <Card className="bg-success text-white h-100">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                  <h1 className="display-4">{stats.activeUsers}</h1>
                  <p className="mb-0">Active Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={4} className="mb-3">
              <Card className="bg-info text-white h-100">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                  <h1 className="display-4">{stats.newUsers}</h1>
                  <p className="mb-0">New Users (Today)</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={4} className="mb-3">
              <Card className="bg-light h-100">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                  <h1 className="display-4">{stats.totalClients}</h1>
                  <p className="mb-0">Total Clients</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={4} className="mb-3">
              <Card className="bg-secondary text-white h-100">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                  <h1 className="display-4">{stats.totalMechanics}</h1>
                  <p className="mb-0">Total Mechanics</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={4} className="mb-3">
              <Card className="bg-dark text-white h-100">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                  <h1 className="display-4">{stats.totalAdmins}</h1>
                  <p className="mb-0">Total Admins</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card>
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent System Logs</h5>
              <Button variant="light" size="sm">View All Logs</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.action}</td>
                      <td>{log.user}</td>
                      <td>{log.timestamp}</td>
                      <td>
                        <Badge 
                          bg={log.status === 'Success' ? 'success' : 'danger'}
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Users</h5>
          <Link to="/admin/users" className="btn btn-light btn-sm">
            Manage All Users
          </Link>
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
              {error}
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
                {users.slice(0, 5).map((user) => (
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
                          className="me-1"
                        >
                          {role}
                        </Badge>
                      ))}
                    </td>
                    <td>
                      <Badge bg={user.isActive ? 'success' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-1">Edit</Button>
                      <Button variant="outline-danger" size="sm">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard; 