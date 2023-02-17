import { ftGetTokenMetadata, TokenMetadata } from '../services/ft-contract';
import { toPrecision, toReadableNumber } from '../utils/numbers';
import { getPoolDetails } from '../services/pool';
import { useIntl } from 'react-intl';
import getConfig from '../services/config';
// import {
//   LP_TOKEN_DECIMALS,
//   LP_STABLE_TOKEN_DECIMALS,
// } from '../services/m-token';
// import { XREF_TOKEN_DECIMALS } from '../services/xref';
import BigNumber from 'bignumber.js';
const config = getConfig();
const STABLE_POOL_IDS = config.STABLE_POOL_IDS;
import moment from 'moment';

export const parseAction = async (
  methodName: string,
  params: any,
  tokenId?: string,
  amount?: string
) => {
  switch (methodName) {
    case 'swap': {
      return await parseSwap(params);
    }
    case 'withdraw': {
      return await parseWithdraw(params, tokenId as any);
    }
    case 'register_tokens': {
      return parseRegisterTokens(params);
    }
    case 'add_liquidity': {
      return await parseAddLiquidity(params);
    }
    case 'remove_liquidity': {
      return await parseRemoveLiquidity(params);
    }
    case 'add_simple_pool': {
      return await parseAddSimplePool(params);
    }
    case 'storage_deposit': {
      return await parseStorageDeposit();
    }
    case 'mft_transfer_call': {
      return await parseMtfTransferCall(params);
    }
    case 'withdraw_seed': {
      return await parseWithdrawSeed(params);
    }
    case 'claim_reward_by_farm': {
      return await parseClaimRewardByFarm(params);
    }
    case 'claim_reward_by_seed': {
      return await parseClaimRewardBySeed(params);
    }
    case 'withdraw_reward': {
      return await parseWithdrawReward(params, tokenId as any);
    }
    case 'near_deposit': {
      return await parseNearDeposit();
    }
    case 'ft_transfer_call': {
      return await parseFtTransferCall(params, tokenId as any);
    }
    case 'near_withdraw': {
      return await parseNearWithdraw(params);
    }
    case 'add_stable_liquidity': {
      return await parseAddStableLiquidity(params);
    }
    case 'remove_liquidity_by_tokens': {
      return await parseRemoveStableLiquidity(params);
    }
    case 'unstake': {
      return await parseUnstake(params);
    }
    case 'sell_with_price_callback': {
      return await parseUSNSell(params);
    }
    case 'buy_with_price_callback': {
      return await parseUSNBuy(params);
    }
    case 'call': {
      return await parseCall(tokenId as any);
    }
    case 'force_unlock': {
      return await forceUnlock(params);
    }
    case 'unlock_and_withdraw_seed': {
      return await unlockAndWithdrawSeed(params);
    }
    case 'lock_free_seed': {
      return await lockFreeSeed(params);
    }
    case 'create_proposal': {
      return await createProposal(params);
    }
    case 'extend_whitelisted_accounts': {
      return await extendWhitelistedAccounts(params);
    }
    case 'claim_reward': {
      return await claimReward(params);
    }
    case 'action_proposal': {
      return await actionProposal(params);
    }
    case 'remove_proposal': {
      return await removeProposal(params);
    }
    case 'action_cancel': {
      return await actionCancel(params);
    }
    case 'withdraw_lpt': {
      return await withdrawLpt(params);
    }
    default: {
      return await parseDefault();
    }
  }
};

const parseSwap = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const actionStart = params.actions[0];
  const actionEnd = params.actions[params.actions.length - 1];
  const in_token = await ftGetTokenMetadata(actionStart.token_in);
  const out_token = await ftGetTokenMetadata(actionEnd.token_out);
  const poolIdArr: (number | string)[] = [];
  let amountIn = '0';
  let amountOut = '0';
  if (
    !actionStart.min_amount_out ||
    new BigNumber(actionStart.min_amount_out).isEqualTo('0')
  ) {
    // smart swap
    amountIn = actionStart.amount_in;
    amountOut = actionEnd.min_amount_out;
  } else {
    // normal swap (base,parallel)
    params.actions.forEach((action: any) => {
      const { amount_in, min_amount_out, pool_id } = action;
      amountIn = new BigNumber(amount_in || '0').plus(amountIn).toFixed();
      amountOut = new BigNumber(min_amount_out || '0')
        .plus(amountOut)
        .toFixed();
    });
  }
  params.actions.forEach((action: any) => {
    const { pool_id } = action;
    poolIdArr.push(pool_id);
  });

  return {
    Action: 'Swap',
    'Pool Id': poolIdArr.join(','),
    'Amount In': toReadableNumber(in_token.decimals, amountIn),
    'Min Amount Out': toReadableNumber(out_token.decimals, amountOut),
    'Token In': in_token.symbol,
    'Token Out': out_token.symbol,
  };
};

const parseWithdraw = async (params: any, tokenId: string) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const field: any = {};
  const { token_id, amount } = params;
  if (token_id) {
    const token = await ftGetTokenMetadata(token_id);
    field.Amount = toReadableNumber(token.decimals, amount);
    field.Token = token.symbol;
    field['Token Address'] = token.id;
  } else {
    // present is sell usn
    const token = await ftGetTokenMetadata(tokenId);
    field.Amount = toReadableNumber(token.decimals, amount);
    if (tokenId == config.USN_ID) {
      field.Action = 'Sell USN';
    }
  }
  return {
    Action: 'Withdraw',
    ...field,
  };
};

const parseRegisterTokens = (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  return {
    Action: 'Register Tokens',
    'Token Ids': params.token_ids.join(','),
  };
};

const parseAddLiquidity = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const pool = await getPoolDetails(params.pool_id);
  const tokens = await Promise.all<TokenMetadata>(
    pool.tokenIds.map((id) => ftGetTokenMetadata(id))
  );

  return {
    Action: 'Add Liquidity',
    'Pool Id': params.pool_id,
    'Amount One': toReadableNumber(tokens[0].decimals, params.amounts[0]),
    'Amount Two': toReadableNumber(tokens[1].decimals, params.amounts[1]),
  };
};

const parseRemoveLiquidity = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const pool = await getPoolDetails(params.pool_id);
  const tokens = await Promise.all<TokenMetadata>(
    pool.tokenIds.map((id) => ftGetTokenMetadata(id))
  );
  const result = {
    Action: 'Remove Liquidity',
    'Pool Id': params.pool_id,
    'Amount One': toReadableNumber(tokens[0].decimals, params.min_amounts[0]),
    'Amount Two': toReadableNumber(tokens[1].decimals, params.min_amounts[1]),
  };
  if (new Set(STABLE_POOL_IDS || []).has(pool.id?.toString())) {
    if (tokens[2]) {
      result['Amount Three'] = toReadableNumber(
        tokens[2].decimals,
        params.min_amounts[2]
      );
    }
    result['Shares'] = toReadableNumber(
      // LP_STABLE_TOKEN_DECIMALS,
      18,
      params.shares
    );
  } else {
    result['Shares'] = toReadableNumber(24, params.shares);
  }
  return result;
};

const parseAddSimplePool = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  return {
    Action: 'Add Pool',
    Fee: params.fee,
    'Token One': params.tokens[0],
    'Token Two': params.tokens[1],
  };
};

const parseStorageDeposit = async () => {
  return {
    Action: 'Storage Deposit',
  };
};
const parseMtfTransferCall = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amount, receiver_id, token_id, msg } = params;
  const poolId = token_id.split(':')[1];
  const extraData = {};
  if (msg) {
    const extraMsg = JSON.parse(msg.replace(/\\"/g, '"'));
    if (extraMsg != 'Free') {
      const { Lock, Append } = extraMsg;
      if (Lock) {
        const duration_sec = Lock.duration_sec;
        extraData['Month'] = duration_sec / 2592000 + 'M';
      }
      if (Append) {
        const duration_sec = Append.append_duration_sec;
        if (duration_sec == 1) {
          extraData['Second'] = duration_sec;
        } else {
          extraData['Month'] = duration_sec / 2592000 + 'M';
        }
      }
    }
  }
  return {
    Action: extraData['Month'] || extraData['Second'] ? 'Lock LPt' : 'Stake',
    Amount: new Set(STABLE_POOL_IDS || []).has(poolId?.toString())
      ? toReadableNumber(18, amount)
      : toReadableNumber(24, amount),
    'Receiver ID': receiver_id,
    'Token Id': token_id,
    ...extraData,
  };
};
const parseWithdrawSeed = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { seed_id, amount } = params;
  const poolId = seed_id.split('@')[1];
  return {
    Action: 'Unstake',
    Amount: new Set(STABLE_POOL_IDS || []).has(poolId?.toString())
      ? toReadableNumber(18, amount)
      : toReadableNumber(24, amount),
    'Seed Id': seed_id,
  };
};
const parseClaimRewardByFarm = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { farm_id } = params;
  return {
    Action: 'Claim Reward By Farm',
    'Farm Id': farm_id,
  };
};
const parseClaimRewardBySeed = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { seed_id } = params;
  return {
    Action: 'Claim Reward By Seed',
    'Seed Id': seed_id,
  };
};
const parseWithdrawReward = async (params: any, tokenId: string) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { token_id, amount, unregister } = params;
  const token = await ftGetTokenMetadata(token_id);
  const extraData = {};
  if (amount) {
    extraData['Amount'] = toReadableNumber(token.decimals, amount);
    extraData['Unregister'] = unregister;
  }
  return {
    Action:
      tokenId == config.REF_VE_CONTRACT_ID
        ? 'Withdraw Bonus'
        : 'Withdraw Reward',
    'Token Id': token_id,
    ...extraData,
  };
};
const parseNearDeposit = async () => {
  return {
    Action: 'Near Deposit',
  };
};
const parseFtTransferCall = async (params: any, tokenId: string) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { receiver_id, amount, msg } = params;
  let Action;
  let Amount;
  if (receiver_id == config.XREF_TOKEN_ID) {
    Action = 'xREF Stake';
    Amount = toReadableNumber(18, amount);
    return {
      Action,
      Amount,
      'Receiver ID': receiver_id,
    };
  } else if (receiver_id == config.REF_VE_CONTRACT_ID) {
    Action = 'Deposit Bonus';
    const token = await ftGetTokenMetadata(tokenId);
    Amount = toReadableNumber(token.decimals, amount);
    const rewardObj = JSON.parse(msg.replace(/\\"/g, '"')).Reward;
    const { incentive_key, proposal_id } = rewardObj;
    return {
      Action,
      Amount,
      'Receiver ID': receiver_id,
      'Incentive Key': incentive_key,
      'Proposal ID': proposal_id,
    };
  } else if (receiver_id == config.REF_FARM_BOOST_CONTRACT_ID) {
    Action = 'Stake';
    const token = await ftGetTokenMetadata(tokenId);
    Amount = toReadableNumber(token.decimals, amount);
    return {
      Action,
      Amount,
      'Receiver ID': receiver_id,
      msg: (msg && msg.replace(/\\"/g, '"')) || '',
    };
  } else if (msg && receiver_id !== 'aurora') {
    Action = 'Instant swap';
    let actions = [];
    try {
      actions = JSON.parse(msg.replace(/\\"/g, '"')).actions || [];
    } catch (error) {
      return {
        Action,
      };
    }
    let amountOut = '0';
    const poolIdArr: (string | number)[] = [];
    const l = actions[0];
    const in_token = await ftGetTokenMetadata(actions[0].token_in);
    const out_token = await ftGetTokenMetadata(
      actions[actions.length - 1].token_out
    );
    actions.forEach((action: any) => {
      const { min_amount_out, pool_id } = action;
      poolIdArr.push(pool_id);
      amountOut = new BigNumber(min_amount_out || '0')
        .plus(amountOut)
        .toFixed();
    });
    return {
      Action,
      'Pool Id': poolIdArr.join(','),
      'Amount In': (Amount = toReadableNumber(in_token.decimals, amount)),
      'Min Amount Out': toReadableNumber(out_token.decimals, amountOut),
      'Token In': in_token.symbol,
      'Token Out': out_token.symbol,
      'Receiver ID': receiver_id,
    };
  } else {
    Action = receiver_id == config.USN_ID ? 'Buy USN' : 'Deposit';
    const token = await ftGetTokenMetadata(tokenId);
    Amount = toReadableNumber(token.decimals, amount);
    return {
      Action,
      Amount,
      'Receiver ID': receiver_id,
    };
  }
};
const parseNearWithdraw = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amount } = params;
  return {
    Action: 'Near Withdraw',
    Amount: toReadableNumber(24, amount),
  };
};
const parseAddStableLiquidity = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amounts, min_shares, pool_id } = params;
  const pool = await getPoolDetails(params.pool_id);
  const tokens = await Promise.all<TokenMetadata>(
    pool.tokenIds.map((id) => ftGetTokenMetadata(id))
  );
  const tempToken = {};
  tokens.forEach((token, index) => {
    tempToken[token.symbol] = toReadableNumber(token.decimals, amounts[index]);
  });
  let DECIMALS = 24;
  if (new Set(STABLE_POOL_IDS || []).has(pool.id?.toString())) {
    DECIMALS = 18; //LP_STABLE_TOKEN_DECIMALS
  }
  return {
    Action: 'Add Stable Liquidity',
    'Pool id': pool_id,
    ...tempToken,
    'Min shares': toReadableNumber(DECIMALS, min_shares),
  };
};
const parseRemoveStableLiquidity = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amounts, max_burn_shares, pool_id } = params;
  const pool = await getPoolDetails(params.pool_id);
  const tokens = await Promise.all<TokenMetadata>(
    pool.tokenIds.map((id) => ftGetTokenMetadata(id))
  );
  const tempToken = {};
  tokens.forEach((token, index) => {
    tempToken[token.symbol] = toReadableNumber(token.decimals, amounts[index]);
  });
  let DECIMALS = 24;
  if (new Set(STABLE_POOL_IDS || []).has(pool.id?.toString())) {
    DECIMALS = 18; // LP_STABLE_TOKEN_DECIMALS
  }
  return {
    Action: 'Remove Stable Liquidity',
    'Pool id': pool_id,
    ...tempToken,
    'Max burn shares': toReadableNumber(DECIMALS, max_burn_shares),
  };
};
const parseUnstake = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amount } = params;
  return {
    Action: 'xREF Unstake',
    Amount: toReadableNumber(18, amount),
  };
};
const parseUSNBuy = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { near } = params;
  return {
    Action: 'Buy USN',
    Amount: toReadableNumber(24, near),
  };
};
const parseUSNSell = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { tokens } = params;
  return {
    Action: 'Sell USN',
    Amount: toReadableNumber(18, tokens),
  };
};
const parseCall = async (tokenId: string) => {
  if (tokenId == 'aurora') {
    return {
      Action: 'Aurora Call',
    };
  } else {
    return {
      Action: 'Call',
    };
  }
};
const forceUnlock = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { seed_id, unlock_amount } = params;
  const poolId = (seed_id || '').split('@')[1];
  return {
    Action: 'Unlock',
    seedId: seed_id,
    Amount: new Set(STABLE_POOL_IDS || []).has(poolId?.toString())
      ? toReadableNumber(18, unlock_amount)
      : toReadableNumber(24, unlock_amount),
  };
};
const unlockAndWithdrawSeed = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { seed_id, unlock_amount, withdraw_amount } = params;
  const poolId = (seed_id || '').split('@')[1];
  const extraData = {};
  if (Number(withdraw_amount) > 0) {
    extraData['Amount'] =
      new Set(STABLE_POOL_IDS || []).has(poolId?.toString()) ||
      seed_id == config.REF_VE_CONTRACT_ID
        ? toReadableNumber(18, withdraw_amount)
        : toReadableNumber(24, withdraw_amount);
  }
  if (Number(unlock_amount) > 0) {
    extraData['Amount'] = new Set(STABLE_POOL_IDS || []).has(poolId?.toString())
      ? toReadableNumber(18, unlock_amount)
      : toReadableNumber(24, unlock_amount);
  }
  return {
    Action: Number(unlock_amount) > 0 ? 'Unlock' : 'Unstake',
    'Seed Id': seed_id,
    ...extraData,
  };
};
const lockFreeSeed = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amount, seed_id, duration_sec } = params;
  const poolId = (seed_id || '').split('@')[1];
  const month = duration_sec / 2592000;
  return {
    Action: 'Lock Free Seed',
    seedId: seed_id,
    Amount: new Set(STABLE_POOL_IDS || []).has(poolId?.toString())
      ? toReadableNumber(18, amount)
      : toReadableNumber(24, amount),
    Month: month + 'M',
  };
};
const createProposal = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { description, duration_sec, start_at, kind } = params;
  const displayField: any = {};
  if (duration_sec) {
    displayField.Duration =
      toPrecision((duration_sec / (60 * 60)).toString(), 3) + 'h';
  }
  if (start_at) {
    displayField['Start time'] = moment
      .unix(start_at)
      .format('YYYY-MM-DD HH:mm:ss');
  }
  if (kind == 'Common') {
    displayField.Type = 'Common';
    if (description) {
      const { title, link } = JSON.parse(description.replace(/\\"/g, '"'));
      displayField.Title = title;
      displayField.Link = link;
    }
  }
  if (kind && kind['FarmingReward']) {
    displayField.Description = description;
    displayField.Type = 'FarmingReward';
    const { FarmingReward } = kind;
    if (FarmingReward) {
      const { total_reward, farm_list } = FarmingReward;
      displayField['Total Reward'] = total_reward;
      displayField['Farm List'] = farm_list.join(',');
    }
  }
  if (kind && kind['Poll']) {
    displayField.Type = 'Poll';
    if (description) {
      const { title, link } = JSON.parse(description.replace(/\\"/g, '"'));
      displayField.Title = title;
      displayField.Link = link;
    }
    const { Poll } = kind;
    if (Poll) {
      displayField.Options = Poll.options.join(',');
    }
  }
  return {
    Action: 'Create Proposal',
    ...displayField,
  };
};
const extendWhitelistedAccounts = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { accounts } = params;
  return {
    Action: 'Extend Whitelisted Accounts',
    Accounts: accounts?.join(',') || '',
  };
};
const claimReward = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { proposal_id } = params;
  return {
    Action: 'Claim Bonus',
    'Proposal ID': proposal_id,
  };
};
const actionProposal = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { proposal_id, action } = params;
  const field: any = {};
  const farmId = action?.VoteFarm?.farm_id?.toString() || '';
  const pollId = action?.VotePoll?.poll_id?.toString() || '';

  if (farmId) {
    field['Farm ID'] = farmId;
  }
  if (pollId) {
    field['Poll ID'] = pollId;
  }
  if (action == 'VoteApprove' || action == 'VoteReject') {
    field['Vote'] = action;
  }
  return {
    Action: 'Action Proposal',
    'Proposal ID': proposal_id,
    ...field,
  };
};
const removeProposal = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { proposal_id } = params;
  return {
    Action: 'Remove Proposal',
    'Proposal ID': proposal_id,
  };
};
const actionCancel = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { proposal_id } = params;
  return {
    Action: 'Action Cancel',
    'Proposal ID': proposal_id,
  };
};
const withdrawLpt = async (params: any) => {
  try {
    params = JSON.parse(params);
  } catch (error) {
    params = {};
  }
  const { amount } = params;
  return {
    Action: 'Unlock LPt',
    Amount: toReadableNumber(24, amount),
  };
};

const parseDefault = async () => {
  return {
    Action: 'Not Found',
  };
};
