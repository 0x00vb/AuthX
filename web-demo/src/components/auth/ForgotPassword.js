import React, { useState, useContext } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [validated, setValidated] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { forgotPassword, loading, error } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Forgot Password</h4>
            </Card.Header>
            <Card.Body>
              {success ? (
                <Alert variant="success">
                  <p className="mb-0">
                    If an account exists with email <strong>{email}</strong>, you will receive password reset instructions.
                  </p>
                  <p className="mt-3">
                    Please check your email and follow the instructions to reset your password.
                  </p>
                  <div className="mt-3">
                    <Link to="/login" className="btn btn-primary">
                      Return to Login
                    </Link>
                  </div>
                </Alert>
              ) : (
                <>
                  <p className="mb-4">
                    Enter your email address below and we'll send you instructions to reset your password.
                  </p>
                  
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a valid email.
                      </Form.Control.Feedback>
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
                          Sending...
                        </>
                      ) : (
                        'Send Reset Instructions'
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

export default ForgotPassword; 