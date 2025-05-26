export class Result<T, E> {
    public isSuccess: boolean;
    public isFailure: boolean;
    private readonly _value?: T;
    private readonly _error?: E;
  
    private constructor(isSuccess: boolean, error?: E, value?: T) {
      if (isSuccess && error) {
        throw new Error("InvalidOperation: A result cannot be successful and contain an error");
      }
      if (!isSuccess && !error) {
        throw new Error("InvalidOperation: A failing result needs to contain an error message");
      }
      this.isSuccess = isSuccess;
      this.isFailure = !isSuccess;
      this._error = error;
      this._value = value;
      Object.freeze(this);
    }
  
    public getValue(): T {
      if (!this.isSuccess) {
        throw new Error("Can't get the value of an error result.");
      }
      return this._value as T;
    }
  
    public get error(): E {
      if (this.isSuccess) {
        throw new Error("Can't get the error of a success result.");
      }
      return this._error as E;
    }
  
    public static ok<U, V>(value?: U): Result<U, V> {
      return new Result<U, V>(true, undefined, value);
    }
  
    public static err<U, V>(error: V): Result<U, V> {
      return new Result<U, V>(false, error);
    }
  }