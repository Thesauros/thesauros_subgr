import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Wallet } from '../../generated/schema';

export class WalletHelper {
  static loadOrCreate(vault: Address, owner: Address): Wallet {
    const id: string = owner.toHexString();

    let wallet = Wallet.load(id);

    if (wallet == null) {
      wallet = new Wallet(id);
      wallet.deposited = BigInt.fromI32(0);
      wallet.withdrawn = BigInt.fromI32(0);
    }

    wallet.vault = vault;
    wallet.owner = owner;

    return wallet;
  }
}
