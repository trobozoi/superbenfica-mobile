/** Stub mínimo de `react-native` para os testes de integração (ambiente Node). */
export const Platform = {
  OS: 'ios' as const,
  select: <T>(spec: { ios?: T; default?: T }) => spec.ios ?? spec.default,
};
