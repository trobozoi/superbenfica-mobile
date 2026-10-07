import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { StatusPedido } from '@/types/api';
import { STATUS_PEDIDO_LABEL } from '@/utils/format';

export function OrderStatusBadge({ status }: Readonly<{ status: StatusPedido }>) {
  const { colors, radius } = useTheme();
  const colorByStatus: Record<StatusPedido, string> = {
    PENDENTE: colors.warning,
    EM_SEPARACAO: colors.info,
    SEPARADO: colors.info,
    SAIU_PARA_ENTREGA: colors.info,
    FINALIZADO: colors.success,
    CANCELADO: colors.danger,
  };
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colorByStatus[status],
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <AppText variant="caption" tone="inverse" bold>
        {STATUS_PEDIDO_LABEL[status]}
      </AppText>
    </View>
  );
}
