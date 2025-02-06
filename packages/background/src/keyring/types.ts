import { PlainObject, Vault } from "../vault";
import { PubKeySecp256k1, PubKeyStarknet } from "@keplr-wallet/crypto";
import { ModularChainInfo } from "@keplr-wallet/types";

export type KeyRingStatus = "empty" | "locked" | "unlocked";

export type BIP44HDPath = {
  account: number;
  change: number;
  addressIndex: number;
};

export interface KeyInfo {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly isSelected: boolean;
  readonly insensitive: PlainObject;
}

export interface KeyRing {
  supportedKeyRingType(): string;
  createKeyRingVault(...args: any[]): Promise<{
    insensitive: PlainObject;
    sensitive: PlainObject;
  }>;
  getPubKey(
    vault: Vault,
    coinType: number,
    modularChainInfo: ModularChainInfo
  ): PubKeySecp256k1 | Promise<PubKeySecp256k1>;
  // This method should only be implemented for Ledger keyring.
  getPubKeyStarknet?(
    vault: Vault,
    modularChainInfo: ModularChainInfo
  ): PubKeyStarknet | Promise<PubKeyStarknet>;
  sign(
    vault: Vault,
    coinType: number,
    data: Uint8Array,
    digestMethod: "sha256" | "keccak256" | "noop",
    modularChainInfo: ModularChainInfo
  ):
    | {
        readonly r: Uint8Array;
        readonly s: Uint8Array;
        readonly v: number | null;
      }
    | Promise<{
        readonly r: Uint8Array;
        readonly s: Uint8Array;
        readonly v: number | null;
      }>;
}

export interface ExportedKeyRingVault {
  type: "mnemonic" | "private-key";
  id: string;
  insensitive: PlainObject;
  sensitive: string;
}
