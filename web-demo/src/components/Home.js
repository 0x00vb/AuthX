import React, { useContext } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Home = () => {
  const { currentUser, hasRole } = useContext(AuthContext);

  const authFeatures = [
    { title: 'User Registration', description: 'Create a new account with email and password' },
    { title: 'User Login', description: 'Authenticate with your credentials' },
    { title: 'Password Recovery', description: 'Reset your password if forgotten' },
    { title: 'JWT Authentication', description: 'Secure token-based authentication' },
    { title: 'Role-Based Access Control', description: 'Different permission levels for different users' },
    { title: 'User Profile Management', description: 'View and edit your profile information' }
  ];

  const roleCards = [
    {
      role: 'client',
      title: 'Client Features',
      description: 'Access client-specific features and dashboard',
      link: '/client',
      color: 'info'
    },
    {
      role: 'mechanic',
      title: 'Mechanic Features',
      description: 'Access mechanic tools and service dashboard',
      link: '/mechanic',
      color: 'success'
    },
    {
      role: 'admin',
      title: 'Admin Features',
      description: 'Manage users, roles, and system configuration',
      link: '/admin',
      color: 'danger'
    }
  ];

  return (
    <div className="container mt-4">
      <div className="jumbotron bg-light p-5 rounded">
        <h1 className="display-4">Welcome to AuthX Demo</h1>
        <p className="lead">
          This demo showcases the features of the AuthX authentication package with role-based access control.
        </p>
        <hr className="my-4" />
        <p>
          Explore different authentication features and role-specific content for clients, mechanics, and administrators.
        </p>
        {!currentUser ? (
          <div>
            <Button as={Link} to="/register" variant="primary" className="me-2">
              Register
            </Button>
            <Button as={Link} to="/login" variant="outline-primary">
              Login
            </Button>
          </div>
        ) : (
          <div>
            <Button as={Link} to="/profile" variant="primary">
              Go to Your Profile
            </Button>
          </div>
        )}
      </div>

      <h2 className="mt-5 mb-4">Authentication Features</h2>
      <Row>
        {authFeatures.map((feature, index) => (
          <Col md={4} className="mb-4" key={index}>
            <Card>
              <Card.Body>
                <Card.Title>{feature.title}</Card.Title>
                <Card.Text>{feature.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {currentUser && (
        <>
          <h2 className="mt-5 mb-4">Your Access Levels</h2>
          <Row>
            {roleCards.map((roleCard, index) => (
              <Col md={4} className="mb-4" key={index}>
                <Card 
                  bg={hasRole(roleCard.role) ? roleCard.color : 'light'} 
                  text={hasRole(roleCard.role) ? 'white' : 'dark'}
                >
                  <Card.Body>
                    <Card.Title>{roleCard.title}</Card.Title>
                    <Card.Text>{roleCard.description}</Card.Text>
                    {hasRole(roleCard.role) ? (
                      <Button as={Link} to={roleCard.link} variant="light">
                        Go to {roleCard.title}
                      </Button>
                    ) : (
                      <Card.Text className="font-italic">
                        You don't have {roleCard.role} access
                      </Card.Text>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export default Home; 