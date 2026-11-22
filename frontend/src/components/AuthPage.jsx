import { useState } from 'react';
import { login, signup, setToken } from '../api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function switchMode() {
    setMode(isSignup ? 'login' : 'signup');
    setErrors({});
    setFormError('');
  }

  function validate() {
    const found = {};
    if (isSignup && !values.name.trim()) found.name = 'Name is required';
    if (!values.email.trim()) found.email = 'Email is required';
    else if (!EMAIL_REGEX.test(values.email.trim())) found.email = 'Email is not valid';
    if (!values.password) found.password = 'Password is required';
    else if (isSignup && values.password.length < 8) {
      found.password = 'Password must be at least 8 characters';
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const result = isSignup ? await signup(values) : await login(values);
      setToken(result.token);
      onAuthenticated(result.user);
    } catch (err) {
      setErrors(err.details || {});
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card lead-form" onSubmit={handleSubmit} noValidate>
        <h1>Lead Manager</h1>
        <h2>{isSignup ? 'Create your account' : 'Log in'}</h2>

        {formError && <p className="form-error">{formError}</p>}

        {isSignup && (
          <label className="field">
            <span>Name</span>
            <input type="text" name="name" value={values.name} onChange={handleChange} />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input type="email" name="email" value={values.email} onChange={handleChange} />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
          {errors.password && <small className="field-error">{errors.password}</small>}
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
        </button>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  );
}

export default AuthPage;