// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type BN from 'bn.js';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';

import React, { useCallback, useEffect, useState } from 'react';

import { BalanceVoting } from '@polkadot/react-query';
import { BN_ZERO } from '@polkadot/util';
import { useApi, useCall } from '@polkadot/react-hooks';

import InputBalance from './InputBalance';
import { useTranslation } from './translate';

interface Props {
  accountId?: string | null;
  autoFocus?: boolean;
  isCouncil?: boolean;
  onChange: (value: BN) => void;
}

interface ValueState {
  maxValue: BN;
  selectedId?: string | null;
  value: BN;
}

function getValues(
  selectedId: string | null | undefined,
  isCouncil: boolean | undefined,
  allBalances: DeriveBalancesAll,
  existential: BN
): ValueState {
  const value = allBalances.lockedBalance;
  const maxValue = allBalances.votingBalance.add(isCouncil ? allBalances.reservedBalance : BN_ZERO);

  return {
    maxValue,
    selectedId,
    value: value.isZero() ? (maxValue.gt(existential) ? maxValue.sub(existential) : BN_ZERO) : value,
  };
}

function VoteValue({ accountId, autoFocus, isCouncil, onChange }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { api } = useApi();
  const allBalances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [accountId]);
  const [{ maxValue, selectedId, value }, setValue] = useState<ValueState>({ maxValue: BN_ZERO, value: BN_ZERO });

  useEffect((): void => {
    // if the set accountId changes and the new balances is for that id, set it
    // eslint-disable-next-line
    allBalances &&
      allBalances.accountId.eq(accountId) &&
      setValue((state) =>
        state.selectedId !== accountId
          ? getValues(accountId, isCouncil, allBalances, api.consts.balances.existentialDeposit)
          : state
      );
  }, [allBalances, accountId, api, isCouncil]);

  // only do onChange to parent when the BN value comes in, not our formatted version
  useEffect((): void => {
    onChange(value);
  }, [onChange, value]);

  const _setValue = useCallback(
    (val?: BN) =>
      setValue((state) =>
        state.selectedId === accountId && val && !val.eq(state.value) ? { ...state, value: val } : state
      ),
    [accountId]
  );

  const isDisabled = accountId !== selectedId;

  return (
    <InputBalance
      autoFocus={autoFocus}
      defaultValue={isDisabled ? undefined : value}
      help={t<string>(
        'The amount that is associated with this vote. This value is is locked for the duration of the vote.'
      )}
      isDisabled={isDisabled}
      isZeroable
      label={t<string>('vote value')}
      labelExtra={
        <BalanceVoting isCouncil={isCouncil} label={<label>{t<string>('voting balance')}</label>} params={accountId} />
      }
      maxValue={maxValue}
      onChange={_setValue}
    />
  );
}

export default React.memo(VoteValue);
