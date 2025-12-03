import { BigInt, Address } from '@graphprotocol/graph-ts';
import { Deposit, FeeCharged, Rebalancer, Withdraw } from '../generated/USDCRebalancer/Rebalancer';
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
  const withdrawFeePercentId = 'withdrawFeePercent';

  let withdrawnVariable = Variable.load(withdrawnId);
  if (withdrawnVariable == null) {
    withdrawnVariable = new Variable(withdrawnId);
    withdrawnVariable.value = new BigInt(0);
  }

  let withdrawFeePercentIdVariable = Variable.load(withdrawFeePercentId);
  if (withdrawFeePercentIdVariable == null) {
    withdrawFeePercentIdVariable = new Variable(withdrawFeePercentId);
    withdrawFeePercentIdVariable.value = new BigInt(0);
  }

  withdrawFeePercentIdVariable.value = getWithdrawFeePercent();

  if (event.block.number <= BigInt.fromI32(194121173)) {
    const assetsAfterFee = event.params.assets;

    const assetsBeforeFee = getAssetsBeforeFee(assetsAfterFee);
    withdrawnVariable.value = withdrawnVariable.value.plus(assetsBeforeFee);
  }
  const assetsBeforeFee = getAssetsBeforeFee(event.params.assets);
  wallet.withdrawn = wallet.withdrawn.plus(assetsBeforeFee);

  withdrawnVariable.save();
  withdrawFeePercentIdVariable.save();
  wallet.save();
}

export function handleFeeCharged(event: FeeCharged): void {
  const withdrawnId = 'withdrawn';

  let withdrawnVariable = Variable.load(withdrawnId);
  if (withdrawnVariable == null) {
    withdrawnVariable = new Variable(withdrawnId);
    withdrawnVariable.value = new BigInt(0);
  }

  withdrawnVariable.value = withdrawnVariable.value.plus(event.params.fee);

  withdrawnVariable.save();
}

function getWithdrawFeePercent(): BigInt {
  const contractAddress = Address.fromString('0x57C10bd3fdB2849384dDe954f63d37DfAD9d7d70');
  const contract = Rebalancer.bind(contractAddress);
  const withdrawFeePercent = contract.withdrawFeePercent();
  return withdrawFeePercent;
}

function getAssetsBeforeFee(assetsAfterFee: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI64(1000000000000000000);
  const withdrawFeePercent = getWithdrawFeePercent();

  const assetsBeforeFee = assetsAfterFee.times(FEE_PRECISION).div(FEE_PRECISION.minus(withdrawFeePercent));

  return assetsBeforeFee;
}
