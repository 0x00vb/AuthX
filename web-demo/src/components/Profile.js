import React, { useContext, useState } from 'react';
import { Card, Row, Col, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';

const Profile = () => {
  const { currentUser, hasRole } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get role-specific class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'mechanic':
        return 'success';
      case 'client':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Check if passwords match when either password field changes
    if (name === 'newPassword' || name === 'confirmPassword') {
      if (name === 'newPassword') {
        setPasswordsMatch(value === formData.confirmPassword || !value);
      } else {
        setPasswordsMatch(value === formData.newPassword || !value);
      }
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      // Reset password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }, 1000);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Your Profile</h2>
      
      {showSuccess && (
        <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible>
          Your profile has been updated successfully!
        </Alert>
      )}
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Profile Details</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <div 
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '100px', height: '100px', fontSize: '36px' }}
                >
                  {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                </div>
                <h4>{currentUser?.firstName} {currentUser?.lastName}</h4>
                <p className="text-muted mb-2">{currentUser?.email}</p>
              </div>
              
              <div className="mb-3">
                <strong>Your Roles:</strong>
                <div className="mt-2">
                  {currentUser?.roles?.map((role) => (
                    <Badge 
                      key={role} 
                      bg={getRoleBadgeClass(role)}
                      className="me-1 mb-1"
                      style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Member Since:</strong>
                <p className="mb-0">{new Date().toLocaleDateString()}</p>
              </div>
              
              <div>
                <strong>Access Links:</strong>
                <ul className="list-unstyled mt-2">
                  {hasRole('client') && (
                    <li className="mb-2">
                      <Button variant="outline-primary" size="sm" href="/client" className="w-100">
                        Client Dashboard
                      </Button>
                    </li>
                  )}
                  {hasRole('mechanic') && (
                    <li className="mb-2">
                      <Button variant="outline-success" size="sm" href="/mechanic" className="w-100">
                        Mechanic Dashboard
                      </Button>
                    </li>
                  )}
                  {hasRole('admin') && (
                    <li className="mb-2">
                      <Button variant="outline-danger" size="sm" href="/admin" className="w-100">
                        Admin Dashboard
                      </Button>
                    </li>
                  )}
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Edit Profile</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileUpdate}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Email cannot be changed. Contact support if you need to update your email.
                  </Form.Text>
                </Form.Group>
                
                <div className="border-top pt-3 mt-4 mb-3">
                  <h5>Change Password</h5>
                  <p className="text-muted small">Leave blank if you don't want to change your password</p>
                </div>
                
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="newPassword">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        isInvalid={!passwordsMatch}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="confirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!passwordsMatch}
                      />
                      {!passwordsMatch && (
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match.
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid mt-4">
                  <Button type="submit" variant="primary" disabled={loading || !passwordsMatch}>
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Updating Profile...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile; 