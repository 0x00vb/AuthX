import React, { useContext } from 'react';
import { Card, Row, Col, ListGroup, Badge } from 'react-bootstrap';
import AuthContext from '../../context/AuthContext';

const ClientDashboard = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Client Dashboard</h2>
      
      <div className="alert alert-info">
        <strong>Role-Based Access:</strong> This page is only accessible to users with the "client" role.
      </div>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Profile Overview</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
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
                  Account Status
                  <Badge bg="success">Active</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Account Type
                  <Badge bg="info">Client</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Member Since
                  <span>{new Date().toLocaleDateString()}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Client Services</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center">
                  Submit Service Request
                  <Badge bg="primary">New</Badge>
                </ListGroup.Item>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center">
                  View Service History
                  <Badge bg="secondary">3 Records</Badge>
                </ListGroup.Item>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center">
                  Schedule Appointment
                  <Badge bg="warning" text="dark">Available</Badge>
                </ListGroup.Item>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center">
                  Billing & Payments
                  <Badge bg="success">No Due</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Recent Activities</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="mb-1">Account Created</h6>
                      <p className="text-muted mb-0 small">Your account was successfully registered</p>
                    </div>
                    <small className="text-muted">Today</small>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="mb-1">Profile Updated</h6>
                      <p className="text-muted mb-0 small">Your profile information was updated</p>
                    </div>
                    <small className="text-muted">Today</small>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="mb-1">Logged In</h6>
                      <p className="text-muted mb-0 small">Successful login from Chrome on Windows</p>
                    </div>
                    <small className="text-muted">Today</small>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClientDashboard; 