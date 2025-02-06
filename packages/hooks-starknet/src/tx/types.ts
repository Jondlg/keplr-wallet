import { ERC20Currency } from "@keplr-wallet/types";
import { CoinPretty } from "@keplr-wallet/unit";

export interface ITxChainSetter {
  chainId: string;
  setChain(chainId: string): void;
}

export interface UIProperties {
  // There is an error that cannot proceed the tx.
  readonly error?: Error;
  // Able to handle tx but prefer to show warning
  readonly warning?: Error;
  // Prefer that the loading UI is displayed.
  // In the case of "loading-block", the UI should handle it so that the user cannot proceed until loading is completed.
  readonly loadingState?: "loading" | "loading-block";
}

export interface IGasConfig extends ITxChainSetter {
  value: string;
  setValue(value: string | number): void;

  gas: number;

  uiProperties: UIProperties;
}

export interface ISenderConfig extends ITxChainSetter {
  value: string;
  setValue(value: string): void;

  sender: string;

  uiProperties: UIProperties;
}

export interface IFeeConfig extends ITxChainSetter {
  type: "ETH" | "STRK";
  setType(type: "ETH" | "STRK"): void;

  gasPrice: CoinPretty | undefined;
  maxGasPrice: CoinPretty | undefined;
  setGasPrice(
    gasPrice:
      | {
          gasPrice: CoinPretty;
          maxGasPrice: CoinPretty;
        }
      | undefined
  ): void;

  fee: CoinPretty | undefined;
  maxFee: CoinPretty | undefined;

  uiProperties: UIProperties;
}

export interface IRecipientConfig extends ITxChainSetter {
  value: string;
  setValue(value: string): void;

  recipient: string;

  uiProperties: UIProperties;
}

export interface IRecipientConfigWithStarknetID extends IRecipientConfig {
  readonly isStarknetIDEnabled: boolean;
  readonly isStarknetID: boolean;
  readonly starknetExpectedDomain: string;
  readonly isStarknetIDFetching: boolean;
}

export interface IAmountConfig extends ITxChainSetter {
  amount: CoinPretty[];

  value: string;
  setValue(value: string): void;

  currency: ERC20Currency;
  setCurrency(currency: ERC20Currency | undefined): void;
  canUseCurrency(currency: ERC20Currency): boolean;

  // Zero means unset.
  fraction: number;
  setFraction(fraction: number): void;

  uiProperties: UIProperties;
}

export interface IGasSimulator {
  enabled: boolean;
  setEnabled(value: boolean): void;

  isSimulating: boolean;

  gasEstimated: number | undefined;
  gasAdjustment: number;

  gasAdjustmentValue: string;
  setGasAdjustmentValue(gasAdjustment: string | number): void;

  uiProperties: UIProperties;
}
