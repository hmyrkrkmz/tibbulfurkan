import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, TextInput, TextInputProps, ViewProps, ScrollView } from 'react-native';
import { colors, fonts, radius, spacing, typography } from './theme';

export const Screen = ({ children, style, ...rest }: ViewProps & { children: React.ReactNode }) => (
  <View style={[styles.screen, style]} {...rest}>{children}</View>
);

export const H1 = ({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) => (
  <Text testID={testID} style={[typography.h1, style]}>{children}</Text>
);
export const H2 = ({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) => (
  <Text testID={testID} style={[typography.h2, style]}>{children}</Text>
);
export const H3 = ({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) => (
  <Text testID={testID} style={[typography.h3, style]}>{children}</Text>
);
export const Body = ({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) => (
  <Text testID={testID} style={[typography.body, style]}>{children}</Text>
);
export const Caption = ({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) => (
  <Text testID={testID} style={[typography.caption, style]}>{children}</Text>
);
export const Label = ({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) => (
  <Text testID={testID} style={[typography.label, style]}>{children}</Text>
);

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  testID?: string;
  style?: any;
};
export const Button = ({ title, onPress, variant = 'primary', disabled, testID, style }: ButtonProps) => {
  const v = variant === 'primary' ? styles.btnPrimary : variant === 'secondary' ? styles.btnSecondary : styles.btnGhost;
  const t = variant === 'primary' ? styles.btnPrimaryText : variant === 'secondary' ? styles.btnSecondaryText : styles.btnGhostText;
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, v, disabled && styles.btnDisabled, style]}
    >
      <Text style={[styles.btnText, t]}>{title}</Text>
    </TouchableOpacity>
  );
};

type InputProps = TextInputProps & { label?: string; testID?: string };
export const Input = ({ label, style, testID, ...rest }: InputProps) => (
  <View style={styles.inputWrap}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      testID={testID}
      placeholderTextColor={colors.accentSage}
      style={[styles.input, style]}
      {...rest}
    />
  </View>
);

export const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Chip = ({ label, onRemove, onPress, side, testID }: { label: string; onRemove?: () => void; onPress?: () => void; side?: 'maternal' | 'paternal' | 'self'; testID?: string }) => {
  const bg = side === 'maternal' ? colors.maternalLight : side === 'paternal' ? colors.paternalLight : colors.bgSecondary;
  const fg = side === 'maternal' ? colors.maternalPrimary : side === 'paternal' ? colors.paternalPrimary : colors.textPrimary;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.chip, { backgroundColor: bg, borderColor: fg }]} testID={testID}>
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={8} testID={`${testID}-remove`}>
          <Text style={[styles.chipRemove, { color: fg }]}>×</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

export const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const pct = (step / total) * 100;
  return (
    <View style={styles.progressOuter}>
      <View style={[styles.progressInner, { width: `${pct}%` }]} />
    </View>
  );
};

export const Divider = () => <View style={styles.divider} />;

export const KeyboardScroll = ({ children }: { children: React.ReactNode }) => (
  <ScrollView
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ paddingBottom: spacing.xxl }}
    showsVerticalScrollIndicator={false}
  >
    {children}
  </ScrollView>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.lg,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btnPrimary: { backgroundColor: colors.textPrimary },
  btnPrimaryText: { color: colors.bgPrimary },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.textPrimary },
  btnSecondaryText: { color: colors.textPrimary },
  btnGhost: { backgroundColor: 'transparent' },
  btnGhostText: { color: colors.textSecondary },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 16, letterSpacing: 0.3 },

  inputWrap: { marginBottom: spacing.md },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.round,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  chipRemove: { fontSize: 18, marginLeft: 6, lineHeight: 18 },

  progressOuter: {
    height: 4,
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressInner: {
    height: 4,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.round,
  },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: spacing.md },
});
