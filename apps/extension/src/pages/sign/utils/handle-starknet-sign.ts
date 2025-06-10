import {
  ErrCodeDeviceLocked,
  ErrFailedGetPublicKey,
  ErrFailedInit,
  ErrFailedSign,
  ErrModuleLedgerSign,
  ErrPublicKeyUnmatched,
  ErrSignRejected,
  LedgerOptions,
} from "./ledger-types";
import {
  Call,
  DeployAccountContractPayload,
  num,
  hash as starknetHash,
  shortString,
  constants,
  DeployAccountSignerDetails,
  CallData,
  encode,
  TypedData,
  V3InvocationsSignerDetails,
} from "starknet";
import Transport from "@ledgerhq/hw-transport";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import { KeplrError } from "@keplr-wallet/router";
import {
  DeployAccountFields,
  LedgerError,
  ResponseHashSign,
  ResponsePublicKey,
  ResponseTxSign,
  StarknetClient,
  TxFields,
} from "@ledgerhq/hw-app-starknet";
import { PubKeyStarknet } from "@keplr-wallet/crypto";
import { Fee } from "@keplr-wallet/stores-starknet/build/account/internal";

export const STARKNET_LEDGER_DERIVATION_PATH =
  "m/2645'/1195502025'/1148870696'/0'/0'/0";

export const connectAndSignDeployAccountTxWithLedger = async (
  chainId: string,
  expectedPubKey: Uint8Array,
  {
    classHash,
    constructorCalldata = [],
    addressSalt = 0,
    contractAddress: providedContractAddress,
  }: DeployAccountContractPayload,
  fee: Fee,
  options: LedgerOptions = { useWebHID: true }
): Promise<{
  transaction: DeployAccountSignerDetails;
  signature: string[];
}> => {
  await checkStarknetPubKey(expectedPubKey, options);

  let transport: Transport;
  try {
    transport = options.useWebHID
      ? await TransportWebHID.create()
      : await TransportWebUSB.create();
  } catch (e) {
    console.error(e);
    throw new KeplrError(
      ErrModuleLedgerSign,
      ErrFailedInit,
      "Failed to init transport"
    );
  }

  const nonce = 0; // DEPLOY_ACCOUNT transaction will have a nonce zero as it is the first transaction in the account
  const contractAddress =
    providedContractAddress ??
    starknetHash.calculateContractAddressFromHash(
      addressSalt,
      classHash,
      constructorCalldata,
      0
    );
  const compiledConstructorCalldata = CallData.compile(constructorCalldata);
  const starknetChainId = shortString.encodeShortString(
    chainId.replace("starknet:", "")
  ) as constants.StarknetChainId;

  const deployAccountFields: DeployAccountFields = {
    class_hash: classHash,
    constructor_calldata: compiledConstructorCalldata,
    contractAddress,
    contract_address_salt: num.toHex(addressSalt),
    nonce: nonce,
    chainId: starknetChainId,
    resourceBounds: {
      l2_gas: {
        max_amount: num.toHex(fee.l2MaxGas ?? "0"),
        max_price_per_unit: num.toHex(fee.l2MaxGasPrice ?? "0"),
      },
      l1_gas: {
        max_amount: num.toHex(fee.l1MaxGas),
        max_price_per_unit: num.toHex(fee.l1MaxGasPrice),
      },
      l1_data_gas: {
        max_amount: num.toHex(fee.l1MaxDataGas),
        max_price_per_unit: num.toHex(fee.l1MaxDataGasPrice),
      },
    },
    tip: "0x0",
    paymaster_data: [],
    nonceDataAvailabilityMode: "L1",
    feeDataAvailabilityMode: "L1",
  };

  try {
    const starknetApp = new StarknetClient(transport);
    const res = await starknetApp.signDeployAccount(
      STARKNET_LEDGER_DERIVATION_PATH,
      deployAccountFields
    );

    return handleLedgerResponse(res, () => {
      const { r, s } = res;

      const transaction: DeployAccountSignerDetails = {
        classHash,
        constructorCalldata: compiledConstructorCalldata,
        contractAddress,
        addressSalt,
        version: "0x3",
        nonce: nonce,
        chainId: starknetChainId,
        resourceBounds: {
          l1_gas: {
            max_amount: num.toHex(fee.l1MaxGas),
            max_price_per_unit: num.toHex(fee.l1MaxGasPrice),
          },
          l2_gas: {
            max_amount: num.toHex(fee.l2MaxGas ?? "0"),
            max_price_per_unit: num.toHex(fee.l2MaxGasPrice ?? "0"),
          },
          l1_data_gas: {
            max_amount: num.toHex(fee.l1MaxDataGas),
            max_price_per_unit: num.toHex(fee.l1MaxDataGasPrice),
          },
        },
        tip: "0x0",
        paymasterData: [],
        accountDeploymentData: [],
        nonceDataAvailabilityMode: "L1",
        feeDataAvailabilityMode: "L1",
      };

      return {
        transaction,
        signature: formatStarknetSignature({ r, s }),
      };
    });
  } catch (e) {
    if (e.message?.includes("0x5515")) {
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrCodeDeviceLocked,
        "Device is locked"
      );
    } else {
      throw new KeplrError(ErrModuleLedgerSign, 9999, e.message);
    }
  } finally {
    await transport.close();
  }
};

export const connectAndSignInvokeTxWithLedger = async (
  expectedPubKey: Uint8Array,
  transactions: Call[],
  details: V3InvocationsSignerDetails,
  options: LedgerOptions = { useWebHID: true }
): Promise<string[]> => {
  await checkStarknetPubKey(expectedPubKey, options);

  let transport: Transport;
  try {
    transport = options?.useWebHID
      ? await TransportWebHID.create()
      : await TransportWebUSB.create();
  } catch (e) {
    console.error(e);
    throw new KeplrError(
      ErrModuleLedgerSign,
      ErrFailedInit,
      "Failed to init transport"
    );
  }

  const txFields: TxFields = {
    accountAddress: details.walletAddress,
    tip: details.tip,
    resourceBounds: details.resourceBounds,
    paymaster_data: details.paymasterData,
    chainId: details.chainId,
    nonce: details.nonce,
    nonceDataAvailabilityMode: details.nonceDataAvailabilityMode,
    feeDataAvailabilityMode: details.feeDataAvailabilityMode,
    account_deployment_data: details.accountDeploymentData,
  };

  console.log("txFields", txFields);

  try {
    const starknetApp = new StarknetClient(transport);

    const res = await starknetApp.signTx(
      STARKNET_LEDGER_DERIVATION_PATH,
      transactions,
      txFields
    );

    return handleLedgerResponse(res, () => {
      const { r, s } = res;

      console.log(
        "res.h",
        Buffer.from(res.h).toString("hex"),
        "res.r",
        Buffer.from(res.r).toString("hex"),
        "res.s",
        Buffer.from(res.s).toString("hex"),
        "returnCode",
        res.returnCode
      );

      return formatStarknetSignature({ r, s });
    });
  } catch (e) {
    if (e.message?.includes("0x5515")) {
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrCodeDeviceLocked,
        "Device is locked"
      );
    } else {
      throw new KeplrError(ErrModuleLedgerSign, 9999, e.message);
    }
  } finally {
    await transport.close();
  }
};

export const connectAndSignMessageWithLedger = async (
  expectedPubKey: Uint8Array,
  message: TypedData,
  signer: string,
  options: LedgerOptions = { useWebHID: true }
): Promise<string[]> => {
  await checkStarknetPubKey(expectedPubKey, options);

  let transport: Transport;
  try {
    transport = options?.useWebHID
      ? await TransportWebHID.create()
      : await TransportWebUSB.create();
  } catch (e) {
    console.error(e);
    throw new KeplrError(
      ErrModuleLedgerSign,
      ErrFailedInit,
      "Failed to init transport"
    );
  }

  try {
    const starknetApp = new StarknetClient(transport);
    const res = await starknetApp.signMessage(
      STARKNET_LEDGER_DERIVATION_PATH,
      message,
      signer
    );

    return handleLedgerResponse(res, () => {
      const { r, s } = res;
      return formatStarknetSignature({ r, s });
    });
  } catch (e) {
    if (e.message?.includes("0x5515")) {
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrCodeDeviceLocked,
        "Device is locked"
      );
    } else {
      throw new KeplrError(ErrModuleLedgerSign, 9999, e.message);
    }
  } finally {
    await transport.close();
  }
};

const formatStarknetSignature = ({
  r,
  s,
}: {
  r: Uint8Array;
  s: Uint8Array;
}): string[] => {
  return [
    encode.addHexPrefix(encode.buf2hex(r)),
    encode.addHexPrefix(encode.buf2hex(s)),
  ];
};

function handleLedgerResponse<R>(
  res: ResponsePublicKey | ResponseHashSign | ResponseTxSign,
  onNoError: () => R
): R {
  switch (res.returnCode) {
    case LedgerError.BadCla:
    case LedgerError.BadIns:
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrFailedGetPublicKey,
        "Failed to get public key"
      );
    case LedgerError.UserRejected:
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrSignRejected,
        "User rejected signing"
      );
    case LedgerError.NoError:
      return onNoError();
    default:
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrFailedSign,
        res.errorMessage ?? "Failed to sign"
      );
  }
}

async function checkStarknetPubKey(
  expectedPubKey: Uint8Array,
  options: LedgerOptions = { useWebHID: true }
) {
  let transport: Transport;
  try {
    transport = options?.useWebHID
      ? await TransportWebHID.create()
      : await TransportWebUSB.create();
  } catch (e) {
    throw new KeplrError(
      ErrModuleLedgerSign,
      ErrFailedInit,
      "Failed to init transport"
    );
  }

  try {
    const starknetApp = new StarknetClient(transport);

    const res = await starknetApp.getPubKey(
      STARKNET_LEDGER_DERIVATION_PATH,
      false
    );

    return handleLedgerResponse(res, () => {
      const { publicKey } = res;

      if (
        Buffer.from(new PubKeyStarknet(expectedPubKey).toBytes()).toString(
          "hex"
        ) !==
        Buffer.from(new PubKeyStarknet(publicKey).toBytes()).toString("hex")
      ) {
        throw new KeplrError(
          ErrModuleLedgerSign,
          ErrPublicKeyUnmatched,
          "Public key unmatched"
        );
      } else {
        return publicKey;
      }
    });
  } catch (e) {
    if (e.message?.includes("0x5515")) {
      throw new KeplrError(
        ErrModuleLedgerSign,
        ErrCodeDeviceLocked,
        "Device is locked"
      );
    } else {
      throw new KeplrError(ErrModuleLedgerSign, 9999, e.message);
    }
  } finally {
    await transport.close();
  }
}
