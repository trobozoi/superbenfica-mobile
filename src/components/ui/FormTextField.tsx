/** Liga o `TextField` ao React Hook Form (valor, erro e blur). */
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { TextField, type TextFieldProps } from './TextField';

interface Props<T extends FieldValues> extends Omit<TextFieldProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  /** Máscara aplicada ao digitar (ex.: CEP, telefone). */
  mask?: (value: string) => string;
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  mask,
  ...fieldProps
}: Readonly<Props<T>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
        <TextField
          ref={ref}
          value={typeof value === 'string' ? value : ''}
          onChangeText={(text) => onChange(mask ? mask(text) : text)}
          onBlur={onBlur}
          error={error?.message}
          {...fieldProps}
        />
      )}
    />
  );
}
