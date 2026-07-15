declare module 'zustand' {
  interface StoreApi<T> {
    getState(): T;
    setState(partial: Partial<T> | ((state: T) => Partial<T>)): void;
    subscribe(listener: (state: T, prevState: T) => void): () => void;
  }

  export function create<T>(initializer: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T): {
    (): T;
    <U>(selector: (state: T) => U): U;
    getState(): T;
    setState(partial: Partial<T> | ((state: T) => Partial<T>)): void;
    subscribe(listener: (state: T, prevState: T) => void): () => void;
  };
}
