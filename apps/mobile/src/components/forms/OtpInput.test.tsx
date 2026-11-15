import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('renders correct number of digit input boxes with value 0000', async () => {
    const onChange = jest.fn();
    const { getAllByDisplayValue } = await render(
      <OtpInput length={4} value="0000" onChange={onChange} />,
    );
    const inputs = getAllByDisplayValue('0');
    expect(inputs).toHaveLength(4);
    inputs.forEach((input) => {
      expect(input.props.textAlign).toBe('center');
    });
  });

  it('calls onChange when a single digit is entered', async () => {
    const onChange = jest.fn();
    const { getAllByDisplayValue } = await render(
      <OtpInput length={4} value="0000" onChange={onChange} />,
    );
    const inputs = getAllByDisplayValue('0');
    fireEvent.changeText(inputs[0], '5');
    expect(onChange).toHaveBeenCalledWith('5000');
  });

  it('handles pasting a multi-digit string', async () => {
    const onChange = jest.fn();
    const { getAllByDisplayValue } = await render(
      <OtpInput length={4} value="0000" onChange={onChange} />,
    );
    const inputs = getAllByDisplayValue('0');
    fireEvent.changeText(inputs[0], '1234');
    expect(onChange).toHaveBeenCalledWith('1234');
  });
});
