/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toHaveTextContent(text?: string | RegExp): R;
      toHaveClass(className?: string): R;
      toBeChecked(): R;
      toBeDisabled(): R;
    }
  }
}

export {};