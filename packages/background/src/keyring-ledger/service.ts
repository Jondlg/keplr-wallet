import { PlainObject, Vault } from "../vault";
import { Buffer } from "buffer/";
import { PubKeySecp256k1, PubKeyStarknet } from "@keplr-wallet/crypto";
import { KeplrError } from "@keplr-wallet/router";
import { ModularChainInfo } from "@keplr-wallet/types";
import { KeyRingService } from "../keyring";

export class KeyRingLedgerService {
  async init(): Promise<void> {
    // TODO: ?
  }

  supportedKeyRingType(): string {
    return "ledger";
  }

  createKeyRingVault(
    pubKey: Uint8Array,
    app: string,
    bip44Path: {
      account: number;
      change: number;
      addressIndex: number;
    }
  ): Promise<{
    insensitive: PlainObject;
    sensitive: PlainObject;
  }> {
    return Promise.resolve({
      insensitive: {
        [app]: {
          pubKey: Buffer.from(pubKey).toString("hex"),
        },
        bip44Path,
      },
      sensitive: {},
    });
  }

  getPubKey(
    vault: Vault,
    _coinType: number,
    modularChainInfo: ModularChainInfo
  ): PubKeySecp256k1 {
    if ("starknet" in modularChainInfo) {
      throw new Error(
        "'getPubKeyStarknet' should be called for Starknet chain"
      );
    }
    if (!("cosmos" in modularChainInfo)) {
      // TODO: 나중에 starknet을 어떻게 지원할지 생각해본다.
      throw new Error("Chain is not a cosmos chain");
    }

    let app = "Cosmos";

    const isEthermintLike = KeyRingService.isEthermintLike(
      modularChainInfo.cosmos
    );
    if (isEthermintLike) {
      app = "Ethereum";
      if (!vault.insensitive[app]) {
        throw new KeplrError(
          "keyring",
          901,
          "No Ethereum public key. Initialize Ethereum app on Ledger by selecting the chain in the extension"
        );
      }
    }

    if (app === "Cosmos") {
      if (vault.insensitive["Terra"]) {
        // Use terra alternatively.
        app = "Terra";
      }
      if (vault.insensitive["Secret"]) {
        app = "Secret";
      }
    }

    if (!vault.insensitive[app]) {
      throw new Error(`Ledger is not initialized for ${app}`);
    }

    const bytes = Buffer.from(
      (vault.insensitive[app] as any)["pubKey"] as string,
      "hex"
    );
    return new PubKeySecp256k1(bytes);
  }

  getPubKeyStarknet(
    vault: Vault,
    modularChainInfo: ModularChainInfo
  ): PubKeyStarknet {
    if (!("starknet" in modularChainInfo)) {
      throw new Error("'modularChainInfo' should have Starknet chain info");
    }

    if (!vault.insensitive["Starknet"]) {
      throw new KeplrError(
        "keyring",
        901,
        "No Starknet public key. Initialize Starknet app on Ledger by selecting the chain in the extension"
      );
    }

    const bytes = Buffer.from(
      (vault.insensitive["Starknet"] as any)["pubKey"] as string,
      "hex"
    );

    return new PubKeyStarknet(bytes);
  }

  sign(): {
    readonly r: Uint8Array;
    readonly s: Uint8Array;
    readonly v: number | null;
  } {
    throw new Error(
      "Ledger can't sign message in background. You should provide the signature from frontend."
    );
  }
}
