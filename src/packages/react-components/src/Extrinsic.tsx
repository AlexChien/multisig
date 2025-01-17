/* eslint-disable @typescript-eslint/no-shadow */
// Copyright 2017-2021 @polkadot/app-extrinsics authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubmittableExtrinsic, SubmittableExtrinsicFunction } from '@polkadot/api/types';
import { Params } from '@polkadot/react-params';
import type { RawParam } from '@polkadot/react-params/types';
import { GenericCall } from '@polkadot/types';
import { getTypeDef } from '@polkadot/types/create';
import type { TypeDef } from '@polkadot/types/types';
import { isUndefined } from '@polkadot/util';
import React, { useCallback, useEffect, useState } from 'react';
import InputExtrinsic from './InputExtrinsic';
import paramComponents from './Params';

interface Props {
  className?: string;
  defaultValue: SubmittableExtrinsicFunction<'promise'>;
  isDisabled?: boolean;
  isError?: boolean;
  isPrivate?: boolean;
  label?: React.ReactNode;
  onChange: (method?: SubmittableExtrinsic<'promise'>) => void;
  onEnter?: () => void;
  onError?: (error?: Error | null) => void;
  onEscape?: () => void;
  withLabel?: boolean;
}

interface CallState {
  fn: SubmittableExtrinsicFunction<'promise'>;
  params: {
    name: string;
    type: TypeDef;
  }[];
}

function getParams({ meta }: SubmittableExtrinsicFunction<'promise'>): { name: string; type: TypeDef }[] {
  return GenericCall.filterOrigin(meta).map((arg): { name: string; type: TypeDef } => ({
    name: arg.name.toString(),
    type: getTypeDef(arg.type.toString()),
  }));
}

function ExtrinsicDisplay({
  defaultValue,
  isDisabled,
  isError,
  isPrivate,
  label,
  onChange,
  onEnter,
  onError,
  onEscape,
  withLabel,
}: Props): React.ReactElement<Props> {
  const [extrinsic, setCall] = useState<CallState>({ fn: defaultValue, params: getParams(defaultValue) });
  const [values, setValues] = useState<RawParam[]>([]);

  useEffect((): void => {
    setValues([]);
  }, [extrinsic]);

  useEffect((): void => {
    const isValid = values.reduce(
      (isValid, value): boolean => isValid && !isUndefined(value) && !isUndefined(value.value) && value.isValid,
      extrinsic.params.length === values.length
    );

    let method;

    if (isValid) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        method = extrinsic.fn(...values.map(({ value }): any => value));
      } catch (error) {
        // eslint-disable-next-line
        onError && onError(error);
      }
    } else {
      // eslint-disable-next-line
      onError && onError(null);
    }

    onChange(method);
  }, [extrinsic, onChange, onError, values]);

  const _onChangeMethod = useCallback(
    (fn: SubmittableExtrinsicFunction<'promise'>): void => setCall({ fn, params: getParams(fn) }),
    []
  );

  const {
    fn: { meta, method, section },
    params,
  } = extrinsic;

  return (
    <div className="extrinsics--Extrinsic">
      <InputExtrinsic
        defaultValue={defaultValue}
        help={meta?.documentation.join(' ')}
        isDisabled={isDisabled}
        isError={isError}
        isPrivate={isPrivate}
        label={label}
        onChange={_onChangeMethod}
        withLabel={withLabel}
      />
      <Params
        key={`${section}.${method}:params` /* force re-render on change */}
        onChange={setValues}
        onEnter={onEnter}
        onEscape={onEscape}
        overrides={paramComponents}
        params={params}
      />
    </div>
  );
}

export default React.memo(ExtrinsicDisplay);
