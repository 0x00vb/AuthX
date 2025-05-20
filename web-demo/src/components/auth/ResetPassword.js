import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [validated, setValidated] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordsMatch(e.target.value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setPasswordsMatch(password === e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    if (!token) {
      return; // No token available
    }
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  if (!token) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Header className="bg-danger text-white">
                <h4 className="mb-0">Invalid Reset Link</h4>
              </Card.Header>
              <Card.Body>
                <Alert variant="danger">
                  <p>
                    The password reset link is invalid or has expired. Please request a new password reset link.
                  </p>
                  <div className="mt-3">
                    <Link to="/forgot-password" className="btn btn-primary">
                      Request New Reset Link
                    </Link>
                  </div>
                </Alert>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Reset Password</h4>
            </Card.Header>
            <Card.Body>
              {success ? (
                <Alert variant="success">
                  <p className="mb-0">
                    Your password has been reset successfully!
                  </p>
                  <p className="mt-3">
                    You will be redirected to the login page in a few seconds...
                  </p>
                  <div className="mt-3">
                    <Link to="/login" className="btn btn-primary">
                      Go to Login
                    </Link>
                  </div>
                </Alert>
              ) : (
                <>
                  <p className="mb-4">
                    Enter your new password below to reset your account password.
                  </p>
                  
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="password">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        minLength="6"
                        isInvalid={validated && !passwordsMatch}
                      />
                      <Form.Control.Feedback type="invalid">
                        Password must be at least 6 characters long.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                        isInvalid={validated && !passwordsMatch}
                      />
                      {!passwordsMatch && (
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match.
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={loading}>
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
                          Resetting Password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </Form>
                </>
              )}
            </Card.Body>
            <Card.Footer className="text-center">
              <Link to="/login">Back to Login</Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 