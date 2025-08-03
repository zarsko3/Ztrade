import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(...classNames: string[]): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: string | string[] | number): R
      toBeChecked(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveStyle(css: string | Record<string, any>): R
      toBeVisible(): R
      toBeEmpty(): R
      toHaveFocus(): R
      toBeRequired(): R
      toBeValid(): R
      toBeInvalid(): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveFormValues(expectedValues: Record<string, any>): R
      toHaveAccessibleName(name: string | RegExp): R
      toHaveAccessibleDescription(description: string | RegExp): R
    }
  }
}

export {} 