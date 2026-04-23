import { commonTokens, tokens } from '@ryicoh/api/plugin';
import { StrykerOptions } from '@ryicoh/api/core';

export class HelloClass {
  public static inject = tokens(commonTokens.options);
  constructor(public options: StrykerOptions) {}
  public sayHello(): string {
    return `hello from ${HelloClass.name}`;
  }
  public sayDelayed(): Promise<unknown> {
    return new Promise((res) => res(`delayed hello from ${HelloClass.name}`));
  }

  public say(...things: string[]): string {
    return `hello ${things.join(' and ')}`;
  }

  public sum(a: number, b: number): number {
    return a + b;
  }

  public reject(): Promise<never> {
    return Promise.reject(new Error('Rejected'));
  }

  public throw(message: string): never {
    throw new Error(message);
  }
}
