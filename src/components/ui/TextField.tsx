import { Ionicons } from '@expo/vector-icons';
import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Mostra o botão de exibir/ocultar senha. */
  password?: boolean;
  ref?: Ref<TextInput>;
}

export function TextField({
  label,
  error,
  password = false,
  style,
  onFocus,
  onBlur,
  ref,
  ...rest
}: Readonly<TextFieldProps>) {
  const { colors, radius, spacing, font } = useTheme();
  const [hidden, setHidden] = useState(password);
  const [focused, setFocused] = useState(false);

  let borderColor = colors.border;
  if (error) borderColor = colors.danger;
  else if (focused) borderColor = colors.primary;

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <View
        style={[
          styles.inputRow,
          { borderColor, borderRadius: radius.md, backgroundColor: colors.surface },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          autoCorrect={!password}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: colors.text, fontSize: font.size.md, paddingHorizontal: spacing.md },
            style,
          ]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            onPress={() => setHidden((v) => !v)}
            style={styles.eye}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, minHeight: 48 },
  eye: { paddingHorizontal: 12, minHeight: 48, justifyContent: 'center' },
});
