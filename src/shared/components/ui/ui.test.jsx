import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Field } from './Field';
import { Alert } from './Alert';
import { isStrongPassword, PASSWORD_RULES } from './PasswordRules';
import { ApiError } from '../../api/api';

describe('Field', () => {
  it('shows and hides a password with the eye button', () => {
    render(<Field label="Password" type="password" value="Secret@123" onChange={() => {}} />);
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('links the error message to the input for screen readers', () => {
    render(<Field label="SKU" value="" onChange={() => {}} error="SKU is required" />);
    const input = screen.getByLabelText('SKU');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('SKU is required');
  });
});

describe('Alert', () => {
  it('shows a heading and the server message', () => {
    render(<Alert text={new ApiError({ message: 'Category already exists with name: Tools' }, 409)} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Category already exists with name: Tools');
  });

  it('lists field errors that are not shown next to an input', () => {
    const error = new ApiError({ message: 'Please correct the highlighted fields.', validationErrors: { sku: 'Bad SKU', price: 'Too high' } }, 400);
    render(<Alert text={error} inlineFields={['sku']} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Price: Too high');
    expect(alert).not.toHaveTextContent('Bad SKU');
  });

  it('renders nothing without an error', () => {
    const { container } = render(<Alert text="" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('password rules', () => {
  it('match the backend policy', () => {
    expect(isStrongPassword('Admin@123')).toBe(true);
    expect(isStrongPassword('admin@123')).toBe(false); // no uppercase
    expect(isStrongPassword('Admin 123!')).toBe(false); // space
    expect(isStrongPassword('A@1a')).toBe(false); // too short
    expect(isStrongPassword(`Aa1!${'x'.repeat(61)}`)).toBe(false); // 65 characters
    expect(PASSWORD_RULES).toHaveLength(6);
  });
});
