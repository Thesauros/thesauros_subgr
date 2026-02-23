import { BigInt } from '@graphprotocol/graph-ts';
import { Deposit, FeesApplied, Withdraw } from '../generated/USDCRebalancer/Rebalancer';
import { Variable } from '../generated/schema';
import { WalletHelper } from './helpers';

export function handleDeposit(event: Deposit): void {
  const wallet = WalletHelper.loadOrCreate(event.address, event.params.owner);

  const depositedId = 'deposited';
  let depositedVariable = Variable.load(depositedId);
  if (depositedVariable == null) {
    depositedVariable = new Variable(depositedId);
    depositedVariable.value = BigInt.fromI32(0);
  }

  depositedVariable.value = depositedVariable.value.plus(event.params.assets);
  wallet.deposited = wallet.deposited.plus(event.params.assets);

  depositedVariable.save();
  wallet.save();
}

export function handleWithdraw(event: Withdraw): void {
  const wallet = WalletHelper.loadOrCreate(event.address, event.params.owner);
  const withdrawnId = 'withdrawn';

  let withdrawnVariable = Variable.load(withdrawnId);
  if (withdrawnVariable == null) {
    withdrawnVariable = new Variable(withdrawnId);
    withdrawnVariable.value = BigInt.fromI32(0);
  }

  // New ABI no longer exposes withdrawFeePercent, so we track withdrawn assets directly from Withdraw.
  withdrawnVariable.value = withdrawnVariable.value.plus(event.params.assets);
  wallet.withdrawn = wallet.withdrawn.plus(event.params.assets);

  withdrawnVariable.save();
  wallet.save();
}

export function handleFeesApplied(event: FeesApplied): void {
  const feesAppliedSharesId = 'feesAppliedShares';

  let feesAppliedShares = Variable.load(feesAppliedSharesId);
  if (feesAppliedShares == null) {
    feesAppliedShares = new Variable(feesAppliedSharesId);
    feesAppliedShares.value = BigInt.fromI32(0);
  }

  const totalFeeShares = event.params.performanceFeeShares.plus(event.params.managementFeeShares);
  feesAppliedShares.value = feesAppliedShares.value.plus(totalFeeShares);

  feesAppliedShares.save();
}
