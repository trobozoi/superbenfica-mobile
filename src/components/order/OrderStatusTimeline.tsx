import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { StatusPedido, TipoEntrega } from '@/types/api';
import { STATUS_PEDIDO_LABEL } from '@/utils/format';

/** Etapas na ordem do backend (`TRANSICOES_PEDIDO`). Retirada não passa por "Saiu para entrega". */
export function stepsFor(tipoEntrega: TipoEntrega): StatusPedido[] {
  return tipoEntrega === 'DOMICILIO'
    ? ['PENDENTE', 'EM_SEPARACAO', 'SEPARADO', 'SAIU_PARA_ENTREGA', 'FINALIZADO']
    : ['PENDENTE', 'EM_SEPARACAO', 'SEPARADO', 'FINALIZADO'];
}

interface Props {
  status: StatusPedido;
  tipoEntrega: TipoEntrega;
}

export function OrderStatusTimeline({ status, tipoEntrega }: Readonly<Props>) {
  const { colors } = useTheme();

  if (status === 'CANCELADO') {
    return (
      <View style={styles.row}>
        <Ionicons name="close-circle" size={24} color={colors.danger} />
        <AppText tone="danger" bold>
          Pedido cancelado
        </AppText>
      </View>
    );
  }

  const steps = stepsFor(tipoEntrega);
  const currentIndex = steps.indexOf(status);

  return (
    <View accessibilityLabel={`Status do pedido: ${STATUS_PEDIDO_LABEL[status]}`}>
      {steps.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === steps.length - 1;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.markerColumn}>
              <Ionicons
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={done ? colors.success : colors.border}
              />
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: index < currentIndex ? colors.success : colors.border },
                  ]}
                />
              )}
            </View>
            <AppText
              bold={index === currentIndex}
              tone={done ? 'default' : 'muted'}
              style={styles.label}
            >
              {STATUS_PEDIDO_LABEL[step]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { flexDirection: 'row', gap: 12 },
  markerColumn: { alignItems: 'center' },
  line: { width: 2, flex: 1, minHeight: 20 },
  label: { paddingTop: 2, paddingBottom: 20 },
});
