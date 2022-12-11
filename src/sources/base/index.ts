/**
 * This is base class for all source class.
 *
 * @class SourceBase
 * @template T
 */
export abstract class SourceBase<T> {
  /**
   * T is class for extra config of source.
   *
   * @type {T}
   * @memberof SourceBase
   */
  public config: T;

  /**
   * fetch is the main method to call and return current wallet balance in JPY
   *
   * @return {*}  {Promise<number>}
   * @memberof SourceBase
   */
  abstract fetch(): Promise<number>;

  constructor(config: T) {
    this.config = config;
  }

  /**
   * This method run prepair work before we can fetch balances. Such as login or check token.
   *
   * @return {*}  {Promise<void>}
   * @memberof SourceBase
   */
  async prepair(): Promise<void> {
    return;
  }
}
