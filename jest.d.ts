import 'jest';

declare module 'jest' {
  interface Jest {
    genMockFromModule: (moduleName: string) => any;
  }
}
