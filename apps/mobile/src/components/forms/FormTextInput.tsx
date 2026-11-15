import { useTranslation } from 'react-i18next';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { TextInput } from '../ui/TextInput';
import type { TextInputProps } from 'react-native';

interface Props<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

/** Wraps ui/TextInput with React Hook Form's Controller so every form field shows its own Zod error inline. */
export function FormTextInput<T extends FieldValues>({ control, name, label, ...props }: Props<T>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <TextInput
          label={label}
          value={value != null ? String(value) : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message ? t(error.message) : undefined}
          {...props}
        />
      )}
    />
  );
}
