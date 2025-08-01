import {
  ChainGetter,
  ObservableQuery,
  QuerySharedContext,
} from "@keplr-wallet/stores";
import { computed, makeObservable } from "mobx";
import { StarknetValidator, StarknetValidators } from "./types";

export class ObservableQueryValidators extends ObservableQuery<StarknetValidators> {
  protected readonly chainId: string;
  protected readonly chainGetter: ChainGetter;

  constructor(
    sharedContext: QuerySharedContext,
    chainId: string,
    chainGetter: ChainGetter
  ) {
    super(
      sharedContext,
      "https://staking-dashboard-mainnet-api-v2.onrender.com/api/",
      "query/validators"
    );
    makeObservable(this);

    this.chainId = chainId;
    this.chainGetter = chainGetter;
  }

  protected override canFetch(): boolean {
    if (this.chainId === "starknet:SN_SEPOLIA") {
      return false;
    }

    return super.canFetch();
  }

  @computed
  get validators(): StarknetValidator[] {
    if (!this.response || !this.response.data) {
      return [];
    }

    if (!Array.isArray(this.response.data)) {
      return [];
    }

    return this.response.data;
  }
}
