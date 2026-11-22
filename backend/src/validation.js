const STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,15}$/;

function validateLead(body) {
  const errors = {};

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const company = (body.company || '').trim();
  const source = body.source;
  const status = body.status || 'New';

  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'Email is not valid';
  if (!phone) errors.phone = 'Phone is required';
  else if (!PHONE_REGEX.test(phone)) errors.phone = 'Phone is not valid';
  if (!company) errors.company = 'Company is required';
  if (!SOURCES.includes(source)) errors.source = 'Source must be one of: ' + SOURCES.join(', ');
  if (!STATUSES.includes(status)) errors.status = 'Status must be one of: ' + STATUSES.join(', ');

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { name, email, phone, company, source, status },
  };
}

module.exports = { validateLead, STATUSES, SOURCES };