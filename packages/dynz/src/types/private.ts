export type PlainPrivateValue<T> = {
  state: "plain";
  value?: T | undefined;
};

export type MaskedPrivateValue = {
  state: "masked";
  value: string;
};

export type PrivateValue<T> = PlainPrivateValue<T> | MaskedPrivateValue;
