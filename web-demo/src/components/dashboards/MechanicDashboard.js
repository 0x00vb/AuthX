import React, { useContext } from 'react';
import { Card, Row, Col, ListGroup, Badge, Table } from 'react-bootstrap';
import AuthContext from '../../context/AuthContext';

const MechanicDashboard = () => {
  const { currentUser } = useContext(AuthContext);

  // Sample service requests data
  const serviceRequests = [
    { id: 'SR-001', client: 'John Doe', service: 'Oil Change', status: 'Pending', date: '2023-06-10' },
    { id: 'SR-002', client: 'Jane Smith', service: 'Brake Repair', status: 'In Progress', date: '2023-06-12' },
    { id: 'SR-003', client: 'Mike Johnson', service: 'Engine Tune-up', status: 'Completed', date: '2023-06-15' },
    { id: 'SR-004', client: 'Sarah Williams', service: 'Tire Rotation', status: 'Pending', date: '2023-06-18' },
  ];

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Mechanic Dashboard</h2>
      
      <div className="alert alert-success">
        <strong>Role-Based Access:</strong> This page is only accessible to users with the "mechanic" role.
      </div>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Mechanic Profile</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
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
                  Status
                  <Badge bg="success">On Duty</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Specialization
                  <Badge bg="primary">General Repairs</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Experience
                  <span>5+ Years</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">Today's Schedule</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item action className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>9:00 AM</strong>
                    <div>Oil Change - Toyota Camry</div>
                  </div>
                  <Badge bg="success">Completed</Badge>
                </ListGroup.Item>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>11:30 AM</strong>
                    <div>Brake Inspection - Honda Civic</div>
                  </div>
                  <Badge bg="warning" text="dark">In Progress</Badge>
                </ListGroup.Item>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>2:00 PM</strong>
                    <div>Tire Rotation - Ford F-150</div>
                  </div>
                  <Badge bg="secondary">Upcoming</Badge>
                </ListGroup.Item>
                <ListGroup.Item action className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>4:30 PM</strong>
                    <div>Battery Replacement - Chevrolet Malibu</div>
                  </div>
                  <Badge bg="secondary">Upcoming</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Performance Stats</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Jobs Completed (Today)
                  <Badge bg="primary">5</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Jobs Completed (Week)
                  <Badge bg="primary">23</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Customer Satisfaction
                  <Badge bg="success">4.8/5</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Efficiency Rating
                  <Badge bg="info">92%</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Service Requests</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Request ID</th>
                <th>Client</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {serviceRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.client}</td>
                  <td>{request.service}</td>
                  <td>
                    <Badge 
                      bg={
                        request.status === 'Completed' 
                          ? 'success' 
                          : request.status === 'In Progress' 
                            ? 'warning' 
                            : 'secondary'
                      }
                      text={request.status === 'In Progress' ? 'dark' : undefined}
                    >
                      {request.status}
                    </Badge>
                  </td>
                  <td>{request.date}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1">View</button>
                    {request.status !== 'Completed' && (
                      <button className="btn btn-sm btn-outline-success">Update</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Inventory Status</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>Oil Filters</strong>
                    <div className="text-muted small">Brand: FilterMaster</div>
                  </div>
                  <Badge bg="success">In Stock (25)</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>Brake Pads</strong>
                    <div className="text-muted small">Brand: BrakeSafe</div>
                  </div>
                  <Badge bg="warning" text="dark">Low Stock (5)</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>Coolant</strong>
                    <div className="text-muted small">Brand: CoolMax</div>
                  </div>
                  <Badge bg="danger">Out of Stock</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong>Air Filters</strong>
                    <div className="text-muted small">Brand: AirPure</div>
                  </div>
                  <Badge bg="success">In Stock (12)</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Technical Resources</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item action className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Service Manuals</h6>
                      <p className="text-muted mb-0 small">Access repair guides and technical documentation</p>
                    </div>
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item action className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Diagnostic Tools</h6>
                      <p className="text-muted mb-0 small">Vehicle diagnostic software and guides</p>
                    </div>
                    <i className="bi bi-tools"></i>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item action className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Training Videos</h6>
                      <p className="text-muted mb-0 small">Tutorial videos for common repair procedures</p>
                    </div>
                    <i className="bi bi-play-circle"></i>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item action className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Parts Catalog</h6>
                      <p className="text-muted mb-0 small">Browse and order replacement parts</p>
                    </div>
                    <i className="bi bi-box"></i>
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

export default MechanicDashboard; 