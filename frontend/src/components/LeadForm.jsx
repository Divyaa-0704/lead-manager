import { useState } from 'react';
import { STATUSES, SOURCES, EMPTY_LEAD } from '../constants';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,15}$/;

const TEXT_FIELDS = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'company', label: 'Company', type: 'text' },
];

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'Email is not valid';
  if (!values.phone.trim()) errors.phone = 'Phone is required';
  else if (!PHONE_REGEX.test(values.phone.trim())) errors.phone = 'Phone is not valid';
  if (!values.company.trim()) errors.company = 'Company is required';
  return errors;
}

function LeadForm({ lead, onSubmit, onCancel }) {
  const [values, setValues] = useState(lead || EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(lead);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const foundErrors = validate(values);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors(err.details || {});
      setFormError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      <h2>{isEditing ? 'Edit Lead' : 'Add Lead'}</h2>

      {formError && <p className="form-error">{formError}</p>}

      {TEXT_FIELDS.map(({ name, label, type }) => (
        <label className="field" key={name}>
          <span>{label}</span>
          <input type={type} name={name} value={values[name]} onChange={handleChange} />
          {errors[name] && <small className="field-error">{errors[name]}</small>}
        </label>
      ))}

      <label className="field">
        <span>Source</span>
        <select name="source" value={values.source} onChange={handleChange}>
          {SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        {errors.source && <small className="field-error">{errors.source}</small>}
      </label>

      <label className="field">
        <span>Status</span>
        <select name="status" value={values.status} onChange={handleChange}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {errors.status && <small className="field-error">{errors.status}</small>}
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Lead'}
        </button>
      </div>
    </form>
  );
}

export default LeadForm;