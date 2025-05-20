import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navigation = () => {
  const { currentUser, logout, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          AuthX Demo
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            
            {currentUser && (
              <>
                <Nav.Link as={Link} to="/profile">
                  Profile
                </Nav.Link>

                {/* Client-specific nav items */}
                {hasRole('client') && (
                  <Nav.Link as={Link} to="/client">
                    Client Dashboard
                  </Nav.Link>
                )}

                {/* Mechanic-specific nav items */}
                {hasRole('mechanic') && (
                  <Nav.Link as={Link} to="/mechanic">
                    Mechanic Dashboard
                  </Nav.Link>
                )}
                
                {/* Admin-specific nav items */}
                {hasRole('admin') && (
                  <>
                    <Nav.Link as={Link} to="/admin">
                      Admin Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/admin/users">
                      User Management
                    </Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {currentUser ? (
              <>
                <Navbar.Text className="me-2">
                  Signed in as: <strong>{currentUser.email}</strong>
                </Navbar.Text>
                <Button variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation; 